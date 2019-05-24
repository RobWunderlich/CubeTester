const argv = require('yargs')
.commandDir('src/commands')
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
	describe: "Use standard engine caching.",
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
.option('repeat', {
	describe: 'Number of times to peform each test',
	default: 1
})
.option('testSyntax', {
	alias: 'ts',
	describe: 'For extract command, syntax to use for generated tests.  "simple" for simplified syntax, "full" for full qHyperCubeDef',
	default: "simple"
})

.demandCommand()
.boolean('useCache')
.boolean('trace')
.argv;


