const async = require('asyncawait/async');
const await = require('asyncawait/await');
const fs = require('fs');

const output = require('./CubeTestWriter');	
const runTest = require('./RunTest');	

var cubeTester = async( function cubeTester(argv) {
	
	try {	
			const testResults = [];
			const testCasesString = fs.readFileSync(argv.infile, "utf8" );
			const testCases = JSON.parse(testCasesString);
			testCases.forEach((testCase, caseIndex) => {
				 testCase.tests.forEach ((test, index) => {	
					test.target = mergeTarget(argv, testCase.target, test.target);	
					let testResult = await( runTest(test, caseIndex + "." + index, argv));	
					testResults.push(testResult);
					output.printTest(testResult);	
					if (test.measures.length > 1) {
						let measures = test.measures;
						measures.map(function(measure) {
							test.measures = [];
							test.measures.push(measure);
							let testResult = await(runTest(test, caseIndex + "." + index, argv));	
							testResults.push(testResult);
							output.printTest(testResult);
						});
					}				
				});
			});
			let totalCalc = testResults.reduce(function (total, cur) {
				return total + cur.result.calctime;
			}, 0);
			console.log("TOTAL: " + testResults.length +  " tests executed, total calctime " +  totalCalc);
			
			process.exit(0);

	} catch (error) {
		console.log(error.stack);
		console.error(error);
		process.exit(-1);
	}	
		
});		// End of cubeTester
module.exports = cubeTester;

function log(msg) {
	console.log(msg);
}

function mergeTarget(argv, testCaseTarget, testTarget) {
	target = {};
	testCaseTarget = testCaseTarget ? testCaseTarget : {};
	testTarget = testTarget ? testTarget : {};
	target.application = firstDefined("",argv.app, testTarget.application, testCaseTarget.application);
	target.endpoint = firstDefined("",argv.endpoint, testTarget.endpoint, testCaseTarget.endpoint);
	target.useCache = firstDefined("",argv.useCache, testTarget.useCache, testCaseTarget.useCache);
	target.user = firstDefined(process.env.userName,argv.user, testTarget.user, testCaseTarget.user);
	target.userDirectory = firstDefined(process.env.userDomain,argv.domain, testTarget.userDirectory, testCaseTarget.userDirectory);
	target.certPath = firstDefined("",argv.certPath, testTarget.certPath, testCaseTarget.certPath);
	
	

	return target;	
}
function firstDefined(dflt,a,b,c) {
	if(a != undefined) return a;
	if(b != undefined) return b;
	if(c != undefined) return c;
	return dflt;
}