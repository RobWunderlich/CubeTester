
const _ = require('lodash');
const extractTests = require('./extractTests');
const getMasterItems = require('./getMasterItems');
const beautify = require("js-beautify");
const fs = require('fs');
const getSession = require('./getSession');

module.exports = argv => {
    let appHandle;
    const testCase = {
        "target": {
            "application": argv.app,
            "endpoint": argv.endpoint
        }
    };
    
    return new Promise((resolve, reject) => {
    session = getSession(argv.endpoint, argv.certPath, argv.user, argv.domain, argv.trace);
    session.open()
    .then(x => globalApi = x)
    .then(() => globalApi.getDocList())
    .then(docList => {
        const doc = _.find(docList, x => {
            if (x.qDocName.toLowerCase().replace('.qvf', '') == argv.app.toLowerCase()) {
                return true;
            }
        });
        if (!doc) {
            throw `App not found: ${argv.app}`;
        }
        return doc.qDocId;
    })
    .then(qDocId => globalApi.openDoc(qDocId))
    .then(app => appHandle = app)
    .then(app => getMasterItems(app))
    .then(list => extractTests(appHandle, list))
    .then(tests => {
        testCase.tests = tests;
        fs.writeFileSync(argv.outfile, beautify(JSON.stringify([testCase])));
        console.log(tests.length +  ` extracted tests written to ${argv.outfile}`);
        return true;
    })
        
    .then(() => session.close())
    .then(resolve)
    .catch(error => {
        console.error(error);
        if (session != null) {
            session.close();
        }        
        reject(error);
    });

   
    });
};