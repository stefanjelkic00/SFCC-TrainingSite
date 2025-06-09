'use strict';

/**
 * Update Products Job - Task 7
 * Job that calls external service and updates product custom attributes
 */

var ProductUpdateService = require('*/cartridge/scripts/services/ProductUpdateService');
var ProductMgr = require('dw/catalog/ProductMgr');
var Transaction = require('dw/system/Transaction');
var Logger = require('dw/system/Logger').getLogger('UpdateProductsJob', 'UpdateProductsJob');
var Status = require('dw/system/Status');

/**
 * Main job execution function
 * @param {dw.job.JobParameters} parameters - Job parameters
 * @returns {dw.system.Status} - Job execution status
 */
function execute(parameters) {
    Logger.info('=== STARTING UPDATE PRODUCTS JOB ===');
    
    var jobResult = {
        totalProducts: 0,
        updatedProducts: 0,
        failedProducts: 0,
        errors: []
    };
    
    try {
        // Get client ID from job parameters or use default
        var clientId = parameters.ClientId || "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
        Logger.info('UpdateProductsJob: Using client ID: {0}', clientId);
        
        // Call the external service
        var serviceResult = ProductUpdateService.callProductUpdateService({
            clientId: clientId
        });
        
        if (serviceResult.status !== 'OK') {
            var errorMsg = 'Service call failed: ' + serviceResult.errorMessage;
            Logger.error('UpdateProductsJob: {0}', errorMsg);
            return new Status(Status.ERROR, 'SERVICE_CALL_FAILED', errorMsg);
        }
        
        // Get products data from service response
        var productsData = serviceResult.object;
        jobResult.totalProducts = productsData.length;
        
        Logger.info('UpdateProductsJob: Processing {0} products', productsData.length);
        
        // Process each product using standard for loop
        for (var i = 0; i < productsData.length; i++) {
            var productData = productsData[i];
            var index = i;
            
            try {
                updateSingleProduct(productData);
                jobResult.updatedProducts++;
                Logger.info('UpdateProductsJob: Successfully updated product {0} ({1}/{2})', 
                    productData.productId, index + 1, productsData.length);
                    
            } catch (e) {
                jobResult.failedProducts++;
                var errorMsg = 'Failed to update product ' + productData.productId + ': ' + e.message;
                jobResult.errors.push(errorMsg);
                Logger.error('UpdateProductsJob: {0}', errorMsg);
            }
        }
        
        // Log final results
        Logger.info('UpdateProductsJob: COMPLETED - Total: {0}, Updated: {1}, Failed: {2}', 
            jobResult.totalProducts, jobResult.updatedProducts, jobResult.failedProducts);
            
        if (jobResult.errors.length > 0) {
            Logger.error('UpdateProductsJob: Errors encountered: {0}', JSON.stringify(jobResult.errors));
        }
        
        // Determine job status
        if (jobResult.failedProducts === 0) {
            return new Status(Status.OK, 'JOB_COMPLETED', 
                'Successfully updated all ' + jobResult.updatedProducts + ' products');
        } else if (jobResult.updatedProducts > 0) {
            return new Status(Status.OK, 'JOB_COMPLETED_WITH_ERRORS', 
                'Updated ' + jobResult.updatedProducts + ' products, ' + jobResult.failedProducts + ' failed');
        } else {
            return new Status(Status.ERROR, 'JOB_FAILED', 
                'Failed to update any products');
        }
        
    } catch (e) {
        Logger.error('UpdateProductsJob: Unexpected error: {0}', e.message);
        Logger.error('UpdateProductsJob: Stack trace: {0}', e.stack);
        return new Status(Status.ERROR, 'JOB_EXCEPTION', 'Job failed with exception: ' + e.message);
        
    } finally {
        Logger.info('=== UPDATE PRODUCTS JOB FINISHED ===');
    }
}

/**
 * Update a single product with new attributes
 * @param {Object} productData - Product data from service
 * @param {String} productData.productId - Product ID
 * @param {Number} productData.productHeight - Product height
 * @param {Number} productData.productWidth - Product width  
 * @param {String} productData.productColor - Product color
 */
function updateSingleProduct(productData) {
    // Find the product
    var product = ProductMgr.getProduct(productData.productId);
    
    if (!product) {
        throw new Error('Product not found: ' + productData.productId);
    }
    
    // Validate product data
    if (productData.productHeight === undefined || productData.productHeight === null) {
        throw new Error('Invalid productHeight value');
    }
    
    if (productData.productWidth === undefined || productData.productWidth === null) {
        throw new Error('Invalid productWidth value');
    }
    
    if (!productData.productColor) {
        throw new Error('Invalid productColor value');
    }
    
    // Update product in transaction
    Transaction.wrap(function() {
        try {
            // Update custom attributes
            product.custom.productHeight = productData.productHeight;
            product.custom.productWidth = productData.productWidth;
            product.custom.productColor = productData.productColor;
            
            Logger.debug('UpdateProductsJob: Updated product {0} - Height: {1}, Width: {2}, Color: {3}',
                productData.productId, productData.productHeight, productData.productWidth, productData.productColor);
                
        } catch (e) {
            Logger.error('UpdateProductsJob: Transaction error for product {0}: {1}', 
                productData.productId, e.message);
            throw e;
        }
    });
}

/**
 * Test function to validate job logic without running full job
 * @param {Object} testData - Test product data
 * @returns {Object} - Test results
 */
function testJobLogic(testData) {
    Logger.info('UpdateProductsJob: Running test mode');
    
    var testData = testData || [
        { "productId": "25565106", "productHeight": 10, "productWidth": 20, "productColor": "blue" }
    ];
    
    var results = {
        success: true,
        message: '',
        processedProducts: 0
    };
    
    try {
        // Using standard for loop here as well for consistency
        for (var i = 0; i < testData.length; i++) {
            updateSingleProduct(testData[i]);
            results.processedProducts++;
        }
        
        results.message = 'Test completed successfully. Processed ' + results.processedProducts + ' products.';
        Logger.info('UpdateProductsJob: {0}', results.message);
        
    } catch (e) {
        results.success = false;
        results.message = 'Test failed: ' + e.message;
        Logger.error('UpdateProductsJob: {0}', results.message);
    }
    
    return results;
}

// Export functions
module.exports = {
    execute: execute,
    updateSingleProduct: updateSingleProduct,
    testJobLogic: testJobLogic
};