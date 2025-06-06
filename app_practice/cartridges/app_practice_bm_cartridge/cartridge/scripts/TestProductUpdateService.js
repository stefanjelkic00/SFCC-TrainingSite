'use strict';

/**
 * Test Script for Product Update Service and Job - Task 7
 * This script tests the service connection, response parsing, and job logic
 */

var ProductUpdateService = require('*/cartridge/scripts/services/ProductUpdateService');
var UpdateProductsJob = require('*/cartridge/scripts/jobs/UpdateProductsJob');
var Logger = require('dw/system/Logger').getLogger('TestProductUpdateService', 'TestProductUpdateService');

/**
 * Test the Product Update Service
 * @returns {Object} - Test results
 */
function testProductUpdateService() {
    Logger.info('=== TESTING PRODUCT UPDATE SERVICE ===');
    
    try {
        // Test service call
        var result = ProductUpdateService.callProductUpdateService({
            clientId: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
        });
        
        Logger.info('Service call status: {0}', result.status);
        Logger.info('Service call error: {0}', result.error);
        Logger.info('Service call error message: {0}', result.errorMessage);
        
        if (result.status === 'OK') {
            var products = result.object;
            Logger.info('SUCCESS: Received {0} products', products.length);
            
            // Log each product
            products.forEach(function(product, index) {
                Logger.info('Product {0}: ID={1}, Height={2}, Width={3}, Color={4}', 
                    index + 1, 
                    product.productId, 
                    product.productHeight, 
                    product.productWidth, 
                    product.productColor
                );
            });
            
            return {
                success: true,
                message: 'Service test successful',
                productCount: products.length,
                products: products
            };
            
        } else {
            Logger.error('FAILED: Service call failed with status: {0}', result.status);
            Logger.error('Error details: {0}', result.errorMessage);
            
            return {
                success: false,
                message: 'Service test failed: ' + result.errorMessage,
                status: result.status
            };
        }
        
    } catch (e) {
        Logger.error('EXCEPTION: {0}', e.message);
        Logger.error('Stack trace: {0}', e.stack);
        
        return {
            success: false,
            message: 'Exception during test: ' + e.message,
            exception: e.message
        };
    } finally {
        Logger.info('=== SERVICE TEST COMPLETED ===');
    }
}

/**
 * Test the Job Logic (without running full job)
 * @returns {Object} - Test results
 */
function testJobLogic() {
    Logger.info('=== TESTING JOB LOGIC ===');
    
    try {
        // Test with sample data
        var testData = [
            { "productId": "25565106", "productHeight": 99, "productWidth": 88, "productColor": "test-blue" }
        ];
        
        var result = UpdateProductsJob.testJobLogic(testData);
        
        Logger.info('Job logic test result: {0}', JSON.stringify(result));
        
        return result;
        
    } catch (e) {
        Logger.error('Job logic test exception: {0}', e.message);
        
        return {
            success: false,
            message: 'Job logic test failed: ' + e.message
        };
    } finally {
        Logger.info('=== JOB LOGIC TEST COMPLETED ===');
    }
}

/**
 * Run comprehensive test of both service and job
 * @returns {Object} - Complete test results
 */
function runCompleteTest() {
    Logger.info('=== RUNNING COMPLETE TASK 7 TEST ===');
    
    var results = {
        serviceTest: null,
        jobTest: null,
        overallSuccess: false,
        summary: ''
    };
    
    try {
        // Test 1: Service
        results.serviceTest = testProductUpdateService();
        
        // Test 2: Job Logic
        results.jobTest = testJobLogic();
        
        // Overall assessment
        results.overallSuccess = results.serviceTest.success && results.jobTest.success;
        
        if (results.overallSuccess) {
            results.summary = 'All tests passed! Task 7 implementation is working correctly.';
            Logger.info('SUCCESS: {0}', results.summary);
        } else {
            results.summary = 'Some tests failed. Check individual test results.';
            Logger.error('PARTIAL FAILURE: {0}', results.summary);
        }
        
    } catch (e) {
        results.summary = 'Complete test failed with exception: ' + e.message;
        Logger.error('EXCEPTION: {0}', results.summary);
    }
    
    Logger.info('=== COMPLETE TEST FINISHED ===');
    return results;
}

/**
 * Execute test - can be called from Business Manager or other scripts
 */
function execute() {
    return runCompleteTest();
}

// Export functions
module.exports = {
    testProductUpdateService: testProductUpdateService,
    testJobLogic: testJobLogic,
    runCompleteTest: runCompleteTest,
    execute: execute
};