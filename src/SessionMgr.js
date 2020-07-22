const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');
const enigma = require('enigma.js');
const schema = require('enigma.js/schemas/12.20.0.json');

const sessionList = [];	
var findSession = async function (target) {
	session = sessionList.find((element) => targetSessionEqual(element.target, target))
	if (!session) {
		session = getSession(target.endpoint, target.certPath, target.user, target.domain, false);
		session.target = target;
		sessionList.push(session);
		session.global = await session.open();
	}
	return session;
}
function getSession(endpoint, certPath, userId, userDirectory, traceSocket) {
    // Helper function to read the contents of the certificate files:
	const readCert = filename => fs.readFileSync(path.resolve(__dirname, certPath, filename));
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
    //_session.on('closed', x => _session = null);
  	return _session;
};

async function closeSessions() {
	await asyncForEach(sessionList, async (session) => {
		await session.close()
	});
}
async function targetSessionEqual(target1, target2) {
	isEqual = 
		target1.endpoint == target2.endpoint 
		&& target1.certPath == target2.certPath
		&& target1.user == target2.user
		&& target1.userDirectory == target2.userDirectory;
	return isEqual;
}
async function asyncForEach(array, callback) {
	for (let index = 0; index < array.length; index++) {
	  await callback(array[index], index, array);
	}
}
module.exports.findSession = findSession;
module.exports.closeSessions = closeSessions;