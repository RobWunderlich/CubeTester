const cubeTester = require('../runtest/CubeTester.js');

exports.command = 'test <infile>';
exports.desc = 'Run tests from test input file';

exports.handler = async function(argv) {
    cubeTester(argv);        
};
