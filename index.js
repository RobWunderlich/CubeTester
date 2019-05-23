//console.log('start ' + Date.now());
const argv = require('yargs')
.commandDir('lib/commands')
.option('app', {
	alias: 'a',
	describe: 'App Id for Desktop, App GUID for Server.'
})
.option('endpoint', {
	alias: 'e',
	describe: 'Websocket endpoint used when connecting to Qlik Desktop/Server.',
	default: 'ws://localhost:9076/'
})
.option('useCache', {
	describe: "Don't attempt to influence use of cache. Lets standard engine caching apply.",
	default: false
})
.option('trace', {
		describe: 'Display socket trace to stdout.',
		default: false
})
.option('user', {
		alias: 'u',
		describe: 'User name used when connecting to Qlik Server.',
		default: process.env.userName
})
.option('domain', {
		alias: 'd',
		describe: 'User domain used when connecting to Qlik Server.',
		default: process.env.userDomain
})
.option('certPath', {
		alias: 'c',
		describe: 'Path to certificates used when connecting to Qlik Server.  Must include these files: client.pem, client_key.pem, and root.pem'
})
.demandCommand()
.argv;


