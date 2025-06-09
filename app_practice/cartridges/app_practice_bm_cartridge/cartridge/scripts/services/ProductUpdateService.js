'use strict';

const LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');

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
        const statusCode = client.statusCode;
        
        if (statusCode !== 200) {
            throw new Error('Service returned status code: ' + statusCode);
        }
        
        const responseData = JSON.parse(responseText);
        
        if (!Array.isArray(responseData)) {
            throw new Error('Response is not an array');
        }
        
        responseData.forEach(function(product, index) {
            if (!product.productId || product.productHeight === undefined || 
                product.productWidth === undefined || !product.productColor) {
                throw new Error('Invalid product data at index ' + index);
            }
        });
        
        return responseData;
    }
});

function callProductUpdateService(params) {
    return productUpdateService.call(params || {});
}

module.exports = {
    callProductUpdateService: callProductUpdateService
};