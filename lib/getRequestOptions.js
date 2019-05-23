const fs = require('fs'),
    path = require('path');

module.exports = settings => {
    const options = { headers: {} };

    if (settings.certPath && !fs.existsSync(settings.certPath)) {
        throw new Error(`Directory not found: ${settings.certPath}`);
    }

    if (settings.certPath) {
        options.cert = fs.readFileSync(path.resolve(settings.certPath, 'client.pem'));
        options.key = fs.readFileSync(path.resolve(settings.certPath, 'client_key.pem'));
        options.ca = fs.readFileSync(path.resolve(settings.certPath, 'root.pem'));
    };

    if (settings.user && settings.domain) {
        options.headers['X-Qlik-User'] = `UserDirectory=${encodeURIComponent(settings.domain)}; UserId=${encodeURIComponent(settings.user)}`
    }

    options.rejectUnauthorized = false;

    return options;
} 