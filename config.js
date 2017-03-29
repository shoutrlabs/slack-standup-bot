module.exports = {
	// go to channel settings > Add an app or integration > search: Incoming webhook
	// create a new webhook in your "standup" channel,
	// set your icon and your name for the webhook (so it looks like you are posting this)
	// copy the webhook URL here
	// webHookURL: 'https://hooks.slack.com/services/XXXXXXX/XXXXXXXX/XXXXXXXXXXXXXXXXXXXXXX',
	webHookURL: '',
	// the beginning of your username, does not have to be the complete name
	// gitUser: 'Zarathustra',
	gitUser: '',
	// these are all commit types that will be included in the standup
	type2icon: {
		fix: ':beetle:',
		feat: ':new:',
		refactor: ':wrench:',
	},
	// path to the git directory
	// gitPaths: ['../project1', '../project2'],
	gitPaths: [],

};
