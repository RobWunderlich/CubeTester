var printTest = function (testResult) {
	let result = testResult.result;
	let test = testResult.test;
	log("Test name: " + test.name + " (" + testResult.index + "), executed at " + result.timestamp);
	log("Endpoint: " + test.target.endpoint + ", useCache: " + test.target.useCache);
	log("Application: " + test.target.application);
	log("Dimensions: " + test.dimensions);
	log("Measures: " + test.measures);
	if(result.error.length > 0) {
		log('Completed with errors.');
		log(result.error.join("\n"));
	} else {
		log("Completed in " + result.calctime + " milliseconds.");
		log("Returned " + result.qSize.qcx + " columns and " + result.qSize.qcy + " rows.");
		log("Measure Total(s): " + result.qGrandTotalRow.map(element => element.qText).join("; "));		
	}
	log("\n");

};
module.exports.printTest = printTest;

function log(msg) {
	console.log(msg);
}
