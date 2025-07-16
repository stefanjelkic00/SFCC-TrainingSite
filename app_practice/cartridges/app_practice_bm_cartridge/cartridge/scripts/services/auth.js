'use strict';

const LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');
const ParsingHelper = require('*/cartridge/scripts/helpers/ParsingHelpers');

const authService = LocalServiceRegistry.createService('external.auth.service', {
    createRequest: function(svc, credentials) {
        svc.setRequestMethod('POST');
        svc.addHeader('Content-Type', 'application/json');
        
        return JSON.stringify({
            username: credentials.username,
            password: credentials.password
        });
    },
    
    parseResponse: function(svc, response) {
        return ParsingHelper.safeJsonParse(response.text, {});
    }
});

module.exports = authService;