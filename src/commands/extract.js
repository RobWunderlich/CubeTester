const cubeExtract = require('../extract/CubeExtract.js');

exports.command = 'extract <app> <outfile>';
exports.desc = 'Extract tests from application';

exports.handler = async function(argv) {
    cubeExtract(argv);        
};