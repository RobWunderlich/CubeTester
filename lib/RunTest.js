const async = require('asyncawait/async');
const await = require('asyncawait/await');
const hDef = require('./HyperCubeModel');
const getSession = require('./getSession');

const runTest = async( function (test, index) {
	let testResult = {};
	testResult.index = index;
	testResult.test = test;	
	testResult.result={};
	const result = testResult.result;	
	result.timestamp = new Date().toString();
	result.error=[];
	
	try {
		session = getSession(test.target.endpoint, test.target.certPath, test.target.user, test.target.userDirectory, false);
		
		let global = await (session.open());
		let app = await( global.openDoc(test.target.application,undefined,undefined,undefined,false));
		let expressions = test.measures;
		let dimensions = test.dimensions;

		hDef.qHyperCubeDef.qDimensions.length = 0;		// Clear existing Dims
		if (dimensions) {
			dimensions.forEach(dim => {
				checkExpressionResult = await(CheckExpression(dim, app));
				if(checkExpressionResult.length > 0) {
					result.error.push(checkExpressionResult);
				} else {
					hDef.qHyperCubeDef.qDimensions.push({"qDef":{"qFieldDefs" : [dim]}});
				}
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
			if (!test.target.useCache) {
				let salt = new Date().getTime().toString().substr(-9);
				hDef.qHyperCubeDef.qMeasures.push({"qDef":{"qDef" : "="+salt}});
			}					
			object = await (app.createSessionObject(hDef));
			var timingStart = Date.now();
			let layout = await (object.getLayout());
			result.calctime = Date.now() - timingStart;
			result.qSize = layout.qHyperCube.qSize;							
			result.qGrandTotalRow = layout.qHyperCube.qGrandTotalRow;
			if (!test.useCache) {	// If not using cache, remove the extra elements created by our unique-salt expression
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
		console.log(error.stack);
		console.error(error);
		if (session != null) {	
			await (session.close());
			session = null;
		}
		result.error.push( error.message);
		return testResult;
}
});
module.exports = runTest;

var CheckExpression = async( function (expr, app) {
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