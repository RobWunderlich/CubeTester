const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');
const enigma = require('enigma.js');
const schema = require('enigma.js/schemas/12.20.0.json');

let _session=null;
var getSession = function (endpoint, certPath, userId, userDirectory, traceSocket) {
    // Helper function to read the contents of the certificate files:
    //console.log('enter GetSession ' + Date.now());
    if (_session!==null) {
        return _session;
    }
	const readCert = filename => fs.readFileSync(path.resolve(__dirname, certificatePath, filename));

	const config = {
		schema,
			url: "",
			suspendOnClose: false
	};
	if (certPath) {
		config.createSocket = url => new WebSocket(url, {
		ca: [readCert('root.pem')],
		key: readCert('client_key.pem'),
		cert: readCert('client.pem'),
		headers: {
	'X-Qlik-User': `UserDirectory=${encodeURIComponent(userDirectory)}; UserId=${encodeURIComponent(userId)}`,
		},
	});
	} else {
		config.createSocket = url => new WebSocket(url);	
	}

	config.url = endpoint + "/app/engineData";		
	_session = enigma.create(config);
	if(traceSocket) {
		// bind traffic events to log what is sent and received on the socket:
		session.on('traffic:sent', data => console.log('sent:', data));
		session.on('traffic:received', data => console.log('received:', data));
    }
    _session.on('closed', x => _session = null);
    
    //console.log('exit GetSession ' + Date.now());
	return _session;
};
module.exports = getSession;