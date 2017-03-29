# slack-standup-bot
Filter and parse structured commit messages and post them to a slack channel as daily standup


## Usage
```
> ./do-standup.js -h
Usage: do-standup.js [options] [gitPaths]

Options:
  -c, --config      Use config file
  -u, --gituser     Github user name (does not have to be complete)
  -w, --webhookurl  Slack web hook URL
  -t, --test        Test, do not send message to Slack                 [boolean]
  -h, --help        Show help                                          [boolean]

Examples:
  do-standup.js -u Peter -w "http://…"      combine the latest commits and send
  ./project1 ./project2                     them to slack
```


In each project that you add to the standup bot it will create a `last-standup-commit` file. Do not commit this file, add it to your `.gitignore`.

## Config

```
module.exports = {
	// go to channel settings > Add an app or integration > search: Incoming webhook
	// create a new webhook in your "standup" channel,
	// set your icon and your name for the webhook (so it looks like you are posting this)
	// copy the webhook URL here
	webHookURL: 'https://hooks.slack.com/services/XXXXXXX/XXXXXXXX/XXXXXXXXXXXXXXXXXXXXXX',
	// the beginning of your username, does not have to be the complete name
	gitUser: 'Zarathustra',
	// these are all commit types that will be included in the standup
	type2icon: {
		fix: ':beetle:',
		feat: ':new:',
		refactor: ':wrench:',
	},
	// path to the git directory (relative to the config file)
	gitPaths: ['../project1', '../project2'],
};
```

```
 ./slack-standup-bot/do-standup.js -c ./standup-config.js
```
