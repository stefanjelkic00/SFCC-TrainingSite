'use strict';

const LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');
const ParsingHelper = require('*/cartridge/scripts/helpers/ParsingHelpers');

const productUpdateService = LocalServiceRegistry.createService('product.update.service', {
    
    createRequest: function(svc, params) {
        svc.setRequestMethod('POST');
        
        svc.addHeader('Content-Type', 'application/json');
        svc.addHeader('Accept', 'application/json');
        
        const requestBody = {
            client_id: params.clientId || "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
        };
        
        return JSON.stringify(requestBody);
    },
    
    parseResponse: function(svc, client) {
        const responseText = client.text;
        
        return ParsingHelper.safeJsonParse(responseText, []);
    }
});

function getUpdates(params) {
    return productUpdateService.call(params || {});
}

module.exports = {
    getUpdates: getUpdates
};