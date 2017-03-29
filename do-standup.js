#!/usr/bin/env node

const fs = require('fs');
const IncomingWebhook = require('@slack/client').IncomingWebhook;
const conventionalCommitsParser = require('conventional-commits-parser');
const gitRawCommits = require('git-raw-commits');
const simpleGitModule = require('simple-git');
const path = require('path');

const argv = require('yargs')
	.usage('Usage: $0 [options] [gitPaths]')
	.example('$0 -u Peter -w "http://…" ./project1 ./project2', 'combine the latest commits and send them to slack')
	.alias('u', 'gituser')
	.nargs('u', 1)
	.alias('w', 'webhookurl')
	.nargs('w', 1)
	.alias('c', 'config')
	.nargs('c', 1)
	.alias('t', 'test')
	.boolean('t')
	.describe('c', 'Use config file')
	.describe('u', 'Github user name (does not have to be complete)')
	.describe('w', 'Slack web hook URL')
	.describe('t', 'Test, do not send message to Slack')
	.help('h')
	.alias('h', 'help')
	.argv;

// Get the default config file.
let config = require('./config');
// Get the config file provided by the user.
if (argv.c) {
	config = Object.assign(config, require(path.relative(__dirname, argv.c)));
	const configPath = path.dirname(argv.c);
	// Make git paths relative to config file.
	config.gitPaths = config.gitPaths.map(gitPath => path.relative(configPath, gitPath));
}
// Get the user provided paths.
if (argv._.length) config.gitPaths = argv._;
// Convert paths to absolute paths.
config.gitPaths = config.gitPaths.map(gitPath => path.resolve(gitPath));
if (argv.u) config.gitUser = argv.u;
if (argv.w) config.webHookURL = argv.w;

// Throw errors if some need input parameters were not specified.
if (!config.gitPaths.length) throw (new Error('Missing git paths'));
if (!config.gitUser) throw (new Error('Missing git user'));
if (!config.webHookURL) throw (new Error('Missing web hook URL'));

const saveLastCommit = (gitPath) => new Promise((resolve, reject) => {
	simpleGitModule(gitPath).log({}, (error, data) => {
		fs.writeFile(
			path.join(gitPath, 'last-standup-commit'),
			data.all[0].hash,
			(err) => {
				if (err) reject.log(err);
				else resolve();
			}
		);
	});
});

const getCommits = (gitPath) => new Promise((resolve, reject) => {
	const commits = [];
	if (!fs.existsSync(gitPath)) {
		reject(`Path does not exist: ${gitPath}`);
		return;
	}
	if (!fs.existsSync(path.join(gitPath, 'last-standup-commit'))) {
		resolve([]);
	} else {
		fs.readFile(path.join(gitPath, 'last-standup-commit'), 'utf8', (err, lastStandupCommit) => {
			if (err) reject(err);
			process.chdir(gitPath);
			gitRawCommits({ author: config.gitUser, from: lastStandupCommit.trim() })
				.on('data', (data) => {
					commits.push(conventionalCommitsParser.sync(data.toString()));
				})
				.on('end', () => {
					resolve(
						commits
						.filter(m => m.type in config.type2icon)
						.map(m => `${config.type2icon[m.type]} *${m.scope}*: ${m.subject}`)
					);
				});
		});
	}
});

const postToSlack = (messages) => new Promise((resolve, reject) => {
	if (messages.length) {
		const webhook = new IncomingWebhook(config.webHookURL);
		webhook.send({ text: messages.join('\n') },
			(err) => {
				if (err) reject('Error:', err);
				else resolve(`Sent ${messages.length} commits`);
			}
		);
	} else {
		resolve('0 new commits!');
	}
});


if (argv.t) {
	Promise
		.all(
			config.gitPaths.map((gitPath) => getCommits(gitPath))
		)
		.then(
			messageArray => console.log(messageArray.reduce((acc, messages) => [...acc, ...messages], []))
		)
		.catch(errorMessage => {
			console.warn(errorMessage);
		});
} else {
	Promise
		.all(
			config.gitPaths.map((gitPath) => getCommits(gitPath))
		)
		.then(
			messageArray => postToSlack(messageArray.reduce((acc, messages) => [...acc, ...messages], []))
		)
		.then(logMessage => {
			console.log(logMessage);
		})
		.then(() => Promise.all(
			config.gitPaths.map((gitPath) => saveLastCommit(gitPath))
		))
		.catch(errorMessage => {
			console.warn(errorMessage);
		});
}

