var async = require('asyncawait/async');
var await = require('asyncawait/await');
const WebSocket = require('ws');
const fs = require('fs');
const mkdirp = require('mkdirp');
const enigma = require('enigma.js');
const schema = require('enigma.js/schemas/3.2.json');

const config = {
  schema,
  url: 'ws://localhost:9076/app/engineData',
  //url: 'ws://qliksense.lab.panalytics.com/app/engineData',
  createSocket: url => new WebSocket(url),
  suspendOnClose: false,
  protocol: { delta: false },
};

//var expression = "MAX(AGGR(SUM(LineTotalx), OrderDatex))";


//HyperCube Defintion
var hDef = {
	qInfo:{
	  qType: "Chart"
	},
	qHyperCubeDef:{
	  qMeasures: [
		{
		  qDef: {
			qDef: 0
		  }
		}
	  ],
	  qInitialDataFetch:[{
		qTop: 0,
		qLeft: 0,
		qWidth: 2,
		qHeight: 1
	  }]
	}
  };

  

var main = async (function () {
	var qDocName = "MSQ/MSQ Performance Sample App";
	console.log("Testing Application: " + qDocName);
	var timing = 0;
	try {
		const session = enigma.create(config);
	
		// bind traffic events to log what is sent and received on the socket:
		//session.on('traffic:sent', data => console.log('sent:', data));
		//session.on('traffic:received', data => console.log('received:', data));

		session.open()
		.then((global) =>  global.openDoc(qDocName,undefined,undefined,undefined,false))
		.then(function(app){
			var exprData = fs.readFileSync("expressions.txt", "utf8" );
			exprData = exprData.split('\n');
			console.log(exprData.length);
			var expression = "max(aggr(SUM(LineTotal) / Count(DISTINCT SalesOrderID), CustomerID))";
			exprData.forEach (expr => {
				console.log("Testing Expression: " + expr);
				app.checkExpression(expr).then(function(result){
					if (result.qErrorMsg.length + result.qBadFieldNames.length == 0) {
						hDef.qHyperCubeDef.qMeasures[0].qDef.qDef = expression;
						app.createSessionObject(hDef)
						//.then((object) => timingStart = Date.now())
						.then(function(object) {
							var timingStart = Date.now();
							object.getLayout().then(function(layout){
							timing = Date.now() - timingStart;
							console.log('Timing: ' + timing);
							process.exit(0);
							});
						});	
					} else {
						//console.dir(result.qErrorMsg.length);
						if(result.qErrorMsg.length) {
							console.log("Error in expression: " + result.qErrorMsg);
						}
						result.qBadFieldNames.forEach(nxRange => {
							console.log("Bad Fieldname: " + expression.substr(nxRange.qFrom, nxRange.qCount));
						});
						
						process.exit(-1);
					}
				
				});
			});
			
			
			
		});
		//.then(() => session.close());
		//glob = qix.global;
		// list = await (glob.getDocList());
		// await(glob.session.close());

		// Process each document
		// for (var index = 0; index < list.length; index++) {
		// 	var qDocName = list[index].qDocName;
		// 	var qDocId = list[index].qDocId;
		// 	//console.log(list[index]);
		// 	glob = await (enigma.create(config).open());
	// 	var qDocName = "DA sample App";			
	// 		try {
	// 			// Open with nodata
	// 			var app = await (glob.openDoc(qDocName,undefined,undefined,undefined,false));
	// 			var script = await (app.getScript());
	// 			var fname = outdir + "/"+ qDocName + ".qvs";
	// 			mkdirp.sync(fname.substr(0, fname.lastIndexOf("/")));
	// 			fs.writeFile(fname, script, (err) => {
  	// 			if (err) {
	// 				  console.error("***Error writing " + fname + ": " + err.message);
	// 				  errorCount++;
	// 			  }
  	// 			//console.log("Extracted " + fname);
	// 			  successCount++;
	// 		});
			
	// 		} catch (error) {
	// 			console.error(">>>Error reading " + qDocName);
	// 			console.error(error.message);
	// 			errorCount++;
	// 		}
	// 		await(glob.session.close());
			
		
	// 	// }
	} catch (error) {
		console.error(">>>Initialization Error");
		console.error(error.message);
	}
	
	
	//console.log("\nFinished");
	
	//process.exit(0);
	
});
 
main();


