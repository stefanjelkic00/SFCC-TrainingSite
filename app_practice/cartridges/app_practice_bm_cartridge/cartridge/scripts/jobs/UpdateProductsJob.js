'use strict';

const Product = require('*/cartridge/scripts/services/Product');
const ProductMgr = require('dw/catalog/ProductMgr');
const Transaction = require('dw/system/Transaction');
const Status = require('dw/system/Status');

function execute(parameters) {
    const clientId = parameters.ClientId || "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
    
    const serviceResult = Product.getUpdates({
        clientId: clientId
    });
    
    if (serviceResult.status !== 'OK') {
        const errorMsg = 'Service call failed: ' + serviceResult.errorMessage;
        return new Status(Status.ERROR, 'SERVICE_CALL_FAILED', errorMsg);
    }
    
    const productsData = serviceResult.object;
    
    productsData.toArray().forEach(updateSingleProduct);
    
    return new Status(Status.OK, 'JOB_COMPLETED', 
        'Successfully updated all ' + productsData.length + ' products');
}

function updateSingleProduct(productData) {
    const product = ProductMgr.getProduct(productData.productId);
    
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