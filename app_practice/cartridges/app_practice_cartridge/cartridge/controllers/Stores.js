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
        return next();
    }
    
    const product = ProductMgr.getProduct(productId);
    if (!product) {
        return next();
    }
    
    const storeSearchResult = storeHelpers.getStores(radius, postalCode, null, null, req.geolocation, true);
    const storesWithInventory = storeHelpers.getStoresWithInventory(storeSearchResult.stores, productId);
    
    storeHelpers.addInfoWindowHtml(storesWithInventory);
    
    res.json({
        stores: storesWithInventory,
        storesResultsHtml: storeHelpers.createStoresResultsHtml(storesWithInventory),
        product: { id: product.ID, name: product.name },
        searchKey: { postalCode: postalCode },
        radius: radius
    });
    
    next();
});

module.exports = server.exports();