var printTest = function (testResult) {
	let result = testResult.result;
	let test = testResult.test;
	log("Test name: " + test.name + " (" + testResult.caseIndex + "." + testResult.testIndex + "), executed at " + result.timestamp);
	log("Repeat: " + test.target.repeatCounter + "/" + test.target.repeat);
	log("Endpoint: " + test.target.endpoint + ", useCache: " + test.target.useCache);
	log("Application: " + test.target.app);
	if (test.qHyperCubeDef) {
		let dims = test.qHyperCubeDef.qDimensions.map(qDimension => {
			return qDimension.qLibraryId ? "qLibraryId: " + qDimension.qLibraryId : qDimension.qDef.qFieldDefs.join(", ");
		}).join("; ");
		log("Dimensions: " + dims);
		let meas = test.qHyperCubeDef.qMeasures.map(qMeasure => {
			return qMeasure.qLibraryId ? "qLibraryId: " + qMeasure.qLibraryId : qMeasure.qDef.qDef;
		}).join("; ");
		log("Measures: " + meas);

	}
	else {
		log("Dimensions: " + test.dimensions);
		log("Measures: " + test.measures);
	}	
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
