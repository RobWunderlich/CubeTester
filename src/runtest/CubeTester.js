const fs = require('fs');
const output = require('./CubeTestWriter');	
const runTest = require('./RunTest');	
const sessionMgr = require('../SessionMgr');

var cubeTester = async function cubeTester(argv) {
	try {	
			const testResults = [];
			const testCasesString = fs.readFileSync(argv.infile, "utf8" );
			const testCases = JSON.parse(testCasesString);
			await asyncForEach(testCases, async (testCase, caseIndex) => {
					await asyncForEach(testCase.tests, async (test, testIndex) =>  {	
					test.target = mergeTarget(argv, testCase.target, test.target);	
					session = await sessionMgr.findSession(test.target) 
					for (test.target.repeatCounter = 1; test.target.repeatCounter <= test.target.repeat; test.target.repeatCounter++) {
						let testResult = await runTest(test, caseIndex, testIndex, session);	
						testResults.push(testResult);
						output.printTest(testResult);
					}
				});
			});
			sessionMgr.closeSessions();

			// Report totals
			let totalCalc = testResults.reduce(function (total, cur) {
				return total + cur.result.calctime;
			}, 0);
			console.log("TOTAL: " + testResults.length +  " tests executed, total calctime " +  totalCalc);

			process.exit(0);
	} catch (error) {
		console.log(error.stack);
		console.error(error);
		sessionMgr.closeSessions();
		process.exit(-1);
	}	
};		// End of cubeTester
module.exports = cubeTester;

async function asyncForEach(array, callback) {
	for (let index = 0; index < array.length; index++) {
	  await callback(array[index], index, array);
	}
}
function mergeTarget(argv, testCaseTarget, testTarget) {
	return Object.assign({}, argv, testCaseTarget, testTarget)
}
