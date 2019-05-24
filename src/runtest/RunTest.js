const hDef = require('./HyperCubeModel');

const runTest = async function (test, caseIndex, testIndex, session) {
	let testResult = {};
	testResult.caseIndex = caseIndex;
	testResult.testIndex = testIndex;
	testResult.test = test;	
	testResult.result={};
	const result = testResult.result;	
	result.timestamp = new Date().toString();
	result.error=[];
	
	try {
		let app = await session.global.openDoc(test.target.app,undefined,undefined,undefined,false);
		let objectDef;
		if (test.qHyperCubeDef) {
			objectDef = {
				qInfo:{
				  qType: "Chart"
				},
				qHyperCubeDef: test.qHyperCubeDef
			}
		} 
		else {
			objectDef = hDef;
			let expressions = test.measures;
			let dimensions = test.dimensions;
	
			hDef.qHyperCubeDef.qDimensions.length = 0;		// Clear existing Dims
			if (dimensions) {
				await asyncForEach(dimensions, async dim => {
					checkExpressionResult = await CheckExpression(dim, app);
					if(checkExpressionResult.length > 0) {
						result.error.push(checkExpressionResult);
					} else {
						hDef.qHyperCubeDef.qDimensions.push({"qDef":{"qFieldDefs" : [dim]}});
					}
				});
			}	
	
			hDef.qHyperCubeDef.qMeasures.length = 0;		// Clear existing Expressions
			if(expressions) {
				await asyncForEach(expressions, async expr => {
					checkExpressionResult = await CheckExpression(expr, app);
					if(checkExpressionResult.length > 0) {
						result.error.push(checkExpressionResult);
					} else {
						hDef.qHyperCubeDef.qMeasures.push({"qDef":{"qDef" : expr}});
					}
				});
			}	
		}

		if (result.error.length === 0) {
			if (!test.target.useCache) {
				let salt = new Date().getTime().toString().substr(-9);
				objectDef.qHyperCubeDef.qMeasures.push({"qDef":{"qDef" : "="+salt}});
			}					
			object = await app.createSessionObject(objectDef);
			var timingStart = Date.now();
			let layout = await object.getLayout();
			result.calctime = Date.now() - timingStart;
			result.qSize = layout.qHyperCube.qSize;							
			result.qGrandTotalRow = layout.qHyperCube.qGrandTotalRow;
			if (!test.target.useCache) {	// If not using cache, remove the extra elements created by our unique-salt expression
				result.qSize.qcx -= 1;
				result.qGrandTotalRow.pop();
				if (test.qHyperCubeDef) {
					test.qHyperCubeDef.qMeasures.pop();
				}
			}
			await app.destroySessionObject(object.id);
			
		}
		return testResult;
		
	} catch (error) {
		console.log(error.stack);
		console.error(error);
		result.error.push( error.message);
		return testResult;
	}
};
module.exports = runTest;

async function runTest2(app, test, result, objectDef) {
	if (!test.target.useCache) {
		let salt = new Date().getTime().toString().substr(-9);
		objectDef.qHyperCubeDef.qMeasures.push({"qDef":{"qDef" : "="+salt}});
	}					
	object = await app.createSessionObject(objectDef);
	var timingStart = Date.now();
	let layout = await object.getLayout();
	result.calctime = Date.now() - timingStart;
	result.qSize = layout.qHyperCube.qSize;							
	result.qGrandTotalRow = layout.qHyperCube.qGrandTotalRow;
	if (!test.useCache) {	// If not using cache, remove the extra elements created by our unique-salt expression
		result.qSize.qcx -= 1;
		result.qGrandTotalRow.pop();
	}
	return testResult;
}

async function asyncForEach(array, callback) {
	for (let index = 0; index < array.length; index++) {
	  await callback(array[index], index, array);
	}
}

async function CheckExpression (expr, app) {
	result = await app.checkExpression(expr);
	let retStr = result.qErrorMsg.length = 0 ? "" : result.qErrorMsg;	
	if (result.qBadFieldNames.length > 0) {
		retStr += (retStr.Length > 0 ? "; " : "") + "Bad field name(s) ";
		result.qBadFieldNames.forEach(nxRange => {
			retStr += "\"" + expr.substr(nxRange.qFrom, nxRange.qCount) + "\" ";
		});
	}
	return retStr;
};