const getList = require('./getList');
const jp = require('jsonpath');

function extractTests(app, masterList) {
    return  getList(app, 'sheet')
    .then(function (props)  {
         
        let tests = [];
        //let cubes = jp.query(props, '$..qHyperCubeDef');
        let nodes = jp.nodes(props, '$..qHyperCubeDef');
        
        nodes.forEach(node => {
            let parentName = node.path[node.path.length - 2];
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
                let test = {};
                let name = jp.parent(props, jp.stringify(node.path)).title;
                
    
                test.name = name ? name : "";
                test.dimensions = dims;
                test.measures = measures;
                tests.push(test);
            }           
        });
        
        return tests;
    });
}
module.exports = extractTests;