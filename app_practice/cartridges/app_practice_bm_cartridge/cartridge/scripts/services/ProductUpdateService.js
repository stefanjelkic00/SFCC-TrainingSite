'use strict';

/**
 * Product Update Service - Task 7
 * Service for calling external API to get product update data
 */

var LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');
var Logger = require('dw/system/Logger').getLogger('ProductUpdateService', 'ProductUpdateService');

/**
 * Product Update Service Definition
 */
var productUpdateService = LocalServiceRegistry.createService('product.update.service', {
    
    /**
     * Create request for the service call
     * @param {dw.svc.Service} svc - Service instance
     * @param {Object} params - Parameters for the service
     * @returns {String} - Request body as JSON string
     */
    createRequest: function(svc, params) {
        // Set HTTP method
        svc.setRequestMethod('POST');
        
        // Set headers
        svc.addHeader('Content-Type', 'application/json');
        svc.addHeader('Accept', 'application/json');
        
        // Create request body
        var requestBody = {
            client_id: params.clientId || "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
        };
        
        Logger.info('ProductUpdateService: Sending request with client_id: {0}', requestBody.client_id);
        
        return JSON.stringify(requestBody);
    },
    
    /**
     * Parse response from the service
     * @param {dw.svc.Service} svc - Service instance  
     * @param {dw.net.HTTPClient} client - HTTP client with response
     * @returns {Object} - Parsed response data
     */
    parseResponse: function(svc, client) {
        var responseText = client.text;
        var statusCode = client.statusCode;
        
        Logger.info('ProductUpdateService: Received response with status code: {0}', statusCode);
        
        if (statusCode !== 200) {
            Logger.error('ProductUpdateService: Unexpected status code: {0}', statusCode);
            throw new Error('Service returned status code: ' + statusCode);
        }
        
        try {
            var responseData = JSON.parse(responseText);
            
            // Validate response structure
            if (!Array.isArray(responseData)) {
                throw new Error('Response is not an array');
            }
            
            // Validate each product object
            responseData.forEach(function(product, index) {
                if (!product.productId || product.productHeight === undefined || 
                    product.productWidth === undefined || !product.productColor) {
                    throw new Error('Invalid product data at index ' + index);
                }
            });
            
            Logger.info('ProductUpdateService: Successfully parsed {0} products', responseData.length);
            return responseData;
            
        } catch (e) {
            Logger.error('ProductUpdateService: Error parsing response: {0}', e.message);
            throw new Error('Failed to parse service response: ' + e.message);
        }
    },
    
    /**
     * Mock response for local testing
     * @param {dw.svc.Service} svc - Service instance
     * @param {Object} params - Parameters for the service
     * @returns {Object} - Mock response object
     */
    mockCall: function(svc, params) {
        Logger.info('ProductUpdateService: Using mock response');
        
        return {
            statusCode: 200,
            statusMessage: 'OK',
            text: JSON.stringify([
                { "productId": "25565106", "productHeight": 10, "productWidth": 20, "productColor": "blue" },
                { "productId": "25565107", "productHeight": 15, "productWidth": 25, "productColor": "red" },
                { "productId": "25565108", "productHeight": 8, "productWidth": 12, "productColor": "green" }
            ])
        };
    },
    
    /**
     * Filter sensitive data from logs
     * @param {String} msg - Log message
     * @returns {String} - Filtered message
     */
    filterLogMessage: function(msg) {
        return msg;
    }
});

/**
 * Call the product update service
 * @param {Object} params - Service parameters
 * @param {String} params.clientId - Client ID for the API call
 * @returns {dw.svc.Result} - Service call result
 */
function callProductUpdateService(params) {
    var params = params || {};
    
    try {
        Logger.info('ProductUpdateService: Starting service call');
        var result = productUpdateService.call(params);
        
        if (result.status === 'OK') {
            Logger.info('ProductUpdateService: Service call successful');
        } else {
            Logger.error('ProductUpdateService: Service call failed with status: {0}', result.status);
        }
        
        return result;
        
    } catch (e) {
        Logger.error('ProductUpdateService: Exception during service call: {0}', e.message);
        throw e;
    }
}

// Export the service and helper function
module.exports = {
    productUpdateService: productUpdateService,
    callProductUpdateService: callProductUpdateService
};