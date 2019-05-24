const getDimensions = require('./getDimensions');
const getMeasures = require('./getMeasures');
const masterMap = Object.create(null);

function getMasterItems(app) {
    return getDimensions(app)
    .then(dims => {
        dims.forEach(dim => {
            masterMap[dim.qInfo.qId] = dim.qDim.qFieldDefs;
        });
        return masterMap;
    })
    .then(
        getMeasures(app)
        .then(measures => {
            measures.forEach(measure => {
                masterMap[measure.qInfo.qId] = [measure.qMeasure.qDef];
            });            
            return masterMap; 
         })  
        .catch(error => {
            console.log(error);
        })   
     );
 }

module.exports = getMasterItems;