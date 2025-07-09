'use strict';

const server = require('server');
const storeHelpers = require('*/cartridge/scripts/helpers/storeHelpers');

server.extend(module.superModule);

server.get('InventorySearch', function (req, res, next) {
    const ProductMgr = require('dw/catalog/ProductMgr');
    
    const productId = req.querystring.productId;
    const radius = req.querystring.radius || 50;
    const postalCode = req.querystring.postalCode;
    
    if (!productId || !postalCode) {
        res.json({
            error: 'Product ID and postal code are required'
        });
        return next();
    }
    
    const product = ProductMgr.getProduct(productId);
    if (!product) {
        res.json({
            error: 'Product not found'
        });
        return next();
    }
    
    const storeData = storeHelpers.getStoresWithInventoryClean(
        radius, 
        postalCode, 
        null, 
        null, 
        req.geolocation, 
        true,
        productId
    );
    
    res.json({
        stores: storeData.stores,
        product: { 
            id: product.ID, 
            name: product.name 
        },
        searchKey: storeData.searchKey,
        radius: storeData.radius,
        googleMapsApi: storeData.googleMapsApi
    });
    
    next();
});

module.exports = server.exports();