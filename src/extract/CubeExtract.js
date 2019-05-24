const _ = require('lodash');
const getMasterItems = require('./getMasterItems');
const beautify = require("js-beautify");
const fs = require('fs');
const sessionMgr = require('../SessionMgr');
const getList = require('./getList');
const jp = require('jsonpath');

var cubeExtract = async function (argv) {
    const testCase = {
        "target": {
            "app": argv.app,
            "endpoint": argv.endpoint
        }
    };

    try {
        session = await sessionMgr.findSession(argv);
        let docList = await session.global.getDocList()
        
        const doc = _.find(docList, x => {
            if (x.qDocName.toLowerCase().replace('.qvf', '') == argv.app.toLowerCase()) {
                return true;
            }
        });
        if (!doc) {
            throw `App not found: ${argv.app}`;
        }
        let app = await session.global.openDoc(doc.qDocId);
        let list = await  getMasterItems(app)
        let tests = await extractTests(app, list, argv.testSyntax)
        testCase.tests = tests;
        fs.writeFileSync(argv.outfile, beautify(JSON.stringify([testCase])));
        console.log(tests.length +  ` extracted tests written to ${argv.outfile}`);
        sessionMgr.closeSessions();
    } catch (error) {
        console.error(error);
        sessionMgr.closeSessions();
    }
};
async function extractTests(app, masterList, testSyntax) {
    let props = await getList(app, 'sheet')
    let tests = [];
    let nodes = jp.nodes(props, '$..qHyperCubeDef');
    nodes.forEach(node => {
        let parentName = node.path[node.path.length - 2];
        let test = {};
        let name = jp.parent(props, jp.stringify(node.path)).title;
        test.name = name ? name : "";
        if (testSyntax && testSyntax.toLowerCase() == 'full') {
            test.qHyperCubeDef = node.value
        } else {
            if (parentName != "qLayoutExclude") {
                let cube = node.value;
                let dims = [];
                let measures = [];
                
                cube.qDimensions.forEach(dimension => {
                    if (dimension.qLibraryId) {
                        dims.push(masterList[dimension.qLibraryId][0]);
                        } else {
                        dims.push(dimension.qDef.qFieldDefs[0]);
                    }
                });
                cube.qMeasures.forEach(measure => {
                    if (measure.qLibraryId) {
                        measures.push(masterList[measure.qLibraryId][0]);
                    } else {
                        measures.push(measure.qDef.qDef);
                    }
                });
                test.dimensions = dims;
                test.measures = measures;
            }    
        }
        tests.push(test);
    });
    return tests;
}
module.exports = cubeExtract;