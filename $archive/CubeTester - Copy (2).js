var async = require('asyncawait/async');
var await = require('asyncawait/await');
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');
const enigma = require('enigma.js');
const schema = require('enigma.js/schemas/3.2.json');
var argv = require('yargs')
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
		describe: 'Display socket trace to stdout.'
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

console.log("Endpoint: " + argv.endpoint);
const certificatePath = argv.certPath;
const userDirectory = argv.domain;
const userId = argv.user; 
const useCache = argv.useCache;
let sessionOpen = false;
let session=null;


// Helper function to read the contents of the certificate files:
const readCert = filename => fs.readFileSync(path.resolve(__dirname, certificatePath, filename));

const config = {
  schema,
	url: argv.endpoint + "/app/engineData",
	suspendOnClose: true
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

//HyperCube Defintion
var hDef = {
	qInfo:{
	  qType: "Chart"
	},
	qHyperCubeDef:{
		qDimensions:[
    ],
	  qMeasures: [
		],
	  qInitialDataFetch:[{
		qTop: 0,
		qLeft: 0,
		qWidth: 0,
		qHeight: 0
	  }]
	}
  };

  

var main = async (function () {
	var defaultDocName = argv.app;
	var app;
	try {
		//let session = enigma.create(config);
	
		if(argv.trace) {
			// bind traffic events to log what is sent and received on the socket:
			session.on('traffic:sent', data => console.log('sent:', data));
			session.on('traffic:received', data => console.log('received:', data));
		}		

		//let global = await (session.open());

		//app = await(openApp(qDocName));
		
			let exprData = fs.readFileSync(argv.infile, "utf8" );
			let parsed = JSON.parse(exprData);

			parsed.forEach ((item, index) => {

				let testResult = {"calctime" : ""};
				log(index, "Item: " + JSON.stringify(item) );
				if(!item.application) {	// If no item app
					item.application = defaultDocName;
				}
				let itemApp = item.application;
				let expressions = item.measures;
				let dimensions = item.dimensions;

				if(itemApp) {
					app = await(openApp(itemApp));
				}

				hDef.qHyperCubeDef.qDimensions.length = 0;		// Clear existing Dims
				if (dimensions) {
					dimensions.forEach(dim => {
						hDef.qHyperCubeDef.qDimensions.push({"qDef":{"qFieldDefs" : [dim]}});
					});
				}	

				if(expressions) {					
					hDef.qHyperCubeDef.qMeasures.length = 0;		// Clear existing Expressions
					expressions.forEach(expr => {
						checkExpressionResult = await (CheckExpression(expr, app));
						if(checkExpressionResult.length > 0) {
							log(index, "ExpressionError: " + expr + ": " + checkExpressionResult);
						} else {
							hDef.qHyperCubeDef.qMeasures.push({"qDef":{"qDef" : expr}});
						}
					});
				}				
			
				try {
						if (!useCache) {
							let salt = new Date().getTime().toString().substr(-9);
							hDef.qHyperCubeDef.qMeasures.push({"qDef":{"qDef" : "="+salt}});
						}					
						object = await (app.createSessionObject(hDef));
						var timingStart = Date.now();
						let layout = await (object.getLayout());
						testResult.calctime = Date.now() - timingStart;
						testResult.qSize = layout.qHyperCube.qSize;							
						testResult.qGrandTotalRow = layout.qHyperCube.qGrandTotalRow;
						if (!useCache) {	// If not using cache, remove the extra elements created by our unique-salt expression
							testResult.qSize.qcx -= 1;
							testResult.qGrandTotalRow.pop();
						}

						log(index, "TestResult: " + JSON.stringify(testResult));
						if (session != null) {	
							await (session.close());
							session = null;
						}

					} catch(err) {
						console.log(err);
					}
			});
			process.exit(0);

	} catch (error) {
		console.error(">>>Initialization Error");
		console.error(error.message);
		process.exit(-1);
	}	
	
});		// End of Main

function log(index, msg) {
	console.log(index + "; " + msg);
}

var runTest = async (function (item) {
	try {
		let session = enigma.create(config);
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

				if(expressions) {					
					hDef.qHyperCubeDef.qMeasures.length = 0;		// Clear existing Expressions
					expressions.forEach(expr => {
						checkExpressionResult = await (CheckExpression(expr, app));
						if(checkExpressionResult.length > 0) {
							log(index, "ExpressionError: " + expr + ": " + checkExpressionResult);
						} else {
							hDef.qHyperCubeDef.qMeasures.push({"qDef":{"qDef" : expr}});
						}
					});
				}		

				
					if (!useCache) {
						let salt = new Date().getTime().toString().substr(-9);
						hDef.qHyperCubeDef.qMeasures.push({"qDef":{"qDef" : "="+salt}});
					}					
					object = await (app.createSessionObject(hDef));
					var timingStart = Date.now();
					let layout = await (object.getLayout());
					testResult.calctime = Date.now() - timingStart;
					testResult.qSize = layout.qHyperCube.qSize;							
					testResult.qGrandTotalRow = layout.qHyperCube.qGrandTotalRow;
					if (!useCache) {	// If not using cache, remove the extra elements created by our unique-salt expression
						testResult.qSize.qcx -= 1;
						testResult.qGrandTotalRow.pop();
					}

					log(index, "TestResult: " + JSON.stringify(testResult));
					if (session != null) {	
						await (session.close());
						session = null;
					}

				
} catch (error) {
		console.log(error);
		return null;
}
});

var openApp = async (function (qDocName) {
	console.log("Testing Application: " + qDocName);	
	try {
		//if (sessionOpen) {	await (session.close());}
		session = enigma.create(config);
		let global = await (session.open());
		//sessionOpen = true;
		let app = await( global.openDoc(qDocName,undefined,undefined,undefined,false));
		return app;
	} catch (error) {
		console.log(error);
		return null;
	}
});

var CheckExpression = async (function (expr, app) {
	result = await (app.checkExpression(expr));
	var retStr = result.qErrorMsg.length = 0 ? "" : result.qErrorMsg;	
	if (result.qBadFieldNames.length > 0) {
		retStr += (retStr.Length > 0 ? "; " : "") + "Bad field name(s) ";
		result.qBadFieldNames.forEach(nxRange => {
			retStr += "\"" + expr.substr(nxRange.qFrom, nxRange.qCount) + "\" ";
		});
	}
	return retStr;
});
 
main();


