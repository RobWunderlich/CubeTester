var async = require('asyncawait/async');
var await = require('asyncawait/await');
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');
const enigma = require('enigma.js');
const schema = require('enigma.js/schemas/3.2.json');
const hDef = require('./lib/HyperCubeModel');
const output = require('./lib/CubeTestWriter');

const argv = require('yargs')
.commandDir('lib/commands')
.option('infile', {
		alias: 'i',
		describe: 'Path to file containing expressions to be tested.'
})
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
.demandOption(['infile','app'])
.argv;


const defaultDocName = argv.app;
const defaultEndpoint = argv.endpoint;
const certificatePath = argv.certPath;
const userDirectory = argv.domain;
const userId = argv.user; 
const useCache = argv.useCache;
const traceSocket = argv.trace;


// Helper function to read the contents of the certificate files:
const readCert = filename => fs.readFileSync(path.resolve(__dirname, certificatePath, filename));

const config = {
  schema,
	url: "",
	suspendOnClose: false
};


if (certificatePath) {
		config.createSocket = url => new WebSocket(url, {
    	ca: [readCert('root.pem')],
    	key: readCert('client_key.pem'),
    	cert: readCert('client.pem'),
    	headers: {
      'X-Qlik-User': `UserDirectory=${encodeURIComponent(userDirectory)}; UserId=${encodeURIComponent(userId)}`,
    	},
  	});
} else {
	config.createSocket = url => new WebSocket(url);	
}

var main = async (function () {
	try {	
			let testCasesString = fs.readFileSync(argv.infile, "utf8" );
			let testCases = JSON.parse(testCasesString);
			testCases.forEach((testCase, caseIndex) => {
				testCase.tests.forEach ((test, index) => {		
					test.application = testCase.application ? testCase.application: defaultDocName;
					test.endpoint = testCase.endpoint ? testCase.endpoint: defaultEndpoint;
					test.useCache = testCase.useCache ? testCase.useCache: useCache;
					let testResult = await(runTest(test, caseIndex + "." + index));	
					//log("TestResult: " + JSON.stringify(testResult));
					output.printTest(testResult);					
				});
			});
			
			process.exit(0);

	} catch (error) {
		console.error(error.message);
		process.exit(-1);
	}	
	
});		// End of Main


var runTest = async (function (item, index) {
	let session = null;
	let testResult = {};
	testResult.index = index;
	testResult.test = item;	
	testResult.result={};
	const result = testResult.result;	
	result.timestamp = new Date().toString();
	result.error=[];
	//console.log(argv.app);

	try {
		config.url = item.endpoint + "/app/engineData";		
		session = enigma.create(config);
		if(traceSocket) {
			// bind traffic events to log what is sent and received on the socket:
			session.on('traffic:sent', data => console.log('sent:', data));
			session.on('traffic:received', data => console.log('received:', data));
		}
		let global = await (session.open());
		let app = await( global.openDoc(item.application,undefined,undefined,undefined,false));
		let expressions = item.measures;
		let dimensions = item.dimensions;


		hDef.qHyperCubeDef.qDimensions.length = 0;		// Clear existing Dims
		if (dimensions) {
			dimensions.forEach(dim => {
				hDef.qHyperCubeDef.qDimensions.push({"qDef":{"qFieldDefs" : [dim]}});
			});
		}	

		hDef.qHyperCubeDef.qMeasures.length = 0;		// Clear existing Expressions
		if(expressions) {
			expressions.forEach(expr => {
				checkExpressionResult = await (CheckExpression(expr, app));
				if(checkExpressionResult.length > 0) {
					result.error.push(checkExpressionResult);
				} else {
					hDef.qHyperCubeDef.qMeasures.push({"qDef":{"qDef" : expr}});
				}
			});
		}		

		if (result.error.length === 0) {
			if (!item.useCache) {
				let salt = new Date().getTime().toString().substr(-9);
				hDef.qHyperCubeDef.qMeasures.push({"qDef":{"qDef" : "="+salt}});
			}					
			object = await (app.createSessionObject(hDef));
			var timingStart = Date.now();
			let layout = await (object.getLayout());
			result.calctime = Date.now() - timingStart;
			result.qSize = layout.qHyperCube.qSize;							
			result.qGrandTotalRow = layout.qHyperCube.qGrandTotalRow;
			if (!item.useCache) {	// If not using cache, remove the extra elements created by our unique-salt expression
				result.qSize.qcx -= 1;
				result.qGrandTotalRow.pop();
			}
		}					

		if (session != null) {	
			await (session.close());
			session = null;
		}

		return testResult;

				
} catch (error) {
		console.error(error);
		if (session != null) {	
			await (session.close());
			session = null;
		}
		result.error = error.message;
		return testResult;
}
});


var CheckExpression = async (function (expr, app) {
	result = await (app.checkExpression(expr));
	let retStr = result.qErrorMsg.length = 0 ? "" : result.qErrorMsg;	
	if (result.qBadFieldNames.length > 0) {
		retStr += (retStr.Length > 0 ? "; " : "") + "Bad field name(s) ";
		result.qBadFieldNames.forEach(nxRange => {
			retStr += "\"" + expr.substr(nxRange.qFrom, nxRange.qCount) + "\" ";
		});
	}
	return retStr;
});

function log(msg) {
	console.log(msg);
}

main();


