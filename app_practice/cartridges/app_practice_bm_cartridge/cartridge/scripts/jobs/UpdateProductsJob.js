'use strict';

const ProductUpdateService = require('*/cartridge/scripts/services/ProductUpdateService');
const ProductMgr = require('dw/catalog/ProductMgr');
const Transaction = require('dw/system/Transaction');
const Status = require('dw/system/Status');

function execute(parameters) {
    const clientId = parameters.ClientId || "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
    
    const serviceResult = ProductUpdateService.callProductUpdateService({
        clientId: clientId
    });
    
    if (serviceResult.status !== 'OK') {
        const errorMsg = 'Service call failed: ' + serviceResult.errorMessage;
        return new Status(Status.ERROR, 'SERVICE_CALL_FAILED', errorMsg);
    }
    
    const productsData = serviceResult.object;
    
    for (let i = 0; i < productsData.length; i++) {
        const productData = productsData[i];
        updateSingleProduct(productData);
    }
    
    return new Status(Status.OK, 'JOB_COMPLETED', 
        'Successfully updated all ' + productsData.length + ' products');
}

function updateSingleProduct(productData) {
    const product = ProductMgr.getProduct(productData.productId);
    
    if (!product) {
        throw new Error('Product not found: ' + productData.productId);
    }
    
    if (productData.productHeight === undefined || productData.productHeight === null) {
        throw new Error('Invalid productHeight value');
    }
    
    if (productData.productWidth === undefined || productData.productWidth === null) {
        throw new Error('Invalid productWidth value');
    }
    
    if (!productData.productColor) {
        throw new Error('Invalid productColor value');
    }
    
    Transaction.wrap(function() {
        product.custom.productHeight = productData.productHeight;
        product.custom.productWidth = productData.productWidth;
        product.custom.productColor = productData.productColor;
    });
}

module.exports = {
    execute: execute,
    updateSingleProduct: updateSingleProduct,
};