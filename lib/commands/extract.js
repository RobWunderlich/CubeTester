const cubeExtract = require('../CubeExtract.js');

exports.command = 'extract <app> <outfile>';
exports.desc = 'Extract tests from application';

exports.handler = args => {
    cubeExtract(args)
        .then(() => process.exit(0))
        .catch(error => {
            console.error(JSON.stringify(error));
            process.exit(1);
        });
};