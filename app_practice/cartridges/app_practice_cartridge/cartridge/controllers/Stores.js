'use strict';

/**
 * @namespace Stores
 */

var server = require('server');
var cache = require('*/cartridge/scripts/middleware/cache');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');
var storeHelpers = require('*/cartridge/scripts/helpers/storeHelpers');

// Extend base controller
server.extend(module.superModule);

/**
 * Stores-InventorySearch : Endpoint za pretragu prodavnica sa proverom inventory-ja
 * @name Base/Stores-InventorySearch
 * @function
 * @memberof Stores
 * @param {querystringparameter} - productId - ID proizvoda za proveru
 * @param {querystringparameter} - radius - Radius pretrage
 * @param {querystringparameter} - postalCode - Postal code za pretragu
 * @param {category} - non-sensitive
 * @param {returns} - json
 * @param {serverfunction} - get
 */
server.get('InventorySearch', function (req, res, next) {
    var ProductInventoryMgr = require('dw/catalog/ProductInventoryMgr');
    var StoreMgr = require('dw/catalog/StoreMgr');
    var ProductMgr = require('dw/catalog/ProductMgr');
    
    var productId = req.querystring.productId;
    var radius = req.querystring.radius || 50;
    var postalCode = req.querystring.postalCode;
    
    if (!productId || !postalCode) {
        res.json({
            success: false,
            error: 'Missing required parameters'
        });
        return next();
    }
    
    // Dobavi proizvod
    var product = ProductMgr.getProduct(productId);
    if (!product) {
        res.json({
            success: false,
            error: 'Product not found'
        });
        return next();
    }
    
    // Dobavi sve prodavnice u radiusu
    var storeSearchResult = storeHelpers.getStores(radius, postalCode, null, null, req.geolocation, true);
    var storesWithInventory = [];
    
    // Filtriraj prodavnice koje imaju proizvod na stanju
    storeSearchResult.stores.forEach(function(store) {
        var storeObj = StoreMgr.getStore(store.ID);
        if (storeObj) {
            var inventory = ProductInventoryMgr.getInventoryList(storeObj.inventoryListID);
            if (inventory) {
                var record = inventory.getRecord(productId);
                if (record && record.ATS && record.ATS.value > 0) {
                    // Dodaj informaciju o količini
                    store.availableQuantity = record.ATS.value;
                    store.inventoryListID = storeObj.inventoryListID;
                    storesWithInventory.push(store);
                }
            }
        }
    });
    
    // Kreiraj response sa filtriranim prodavnicama
    var StoresModel = require('*/cartridge/models/stores');
    var Site = require('dw/system/Site');
    var URLUtils = require('dw/web/URLUtils');
    
    var actionUrl = URLUtils.url('Stores-InventorySearch').toString();
    var apiKey = Site.getCurrent().getCustomPreferenceValue('mapAPI');
    
    // Konvertuj array u set-like strukturu za StoresModel
    var storesSet = {};
    storesWithInventory.forEach(function(store, index) {
        storesSet[index] = store;
    });
    
    var result = new StoresModel(
        storesSet,
        { postalCode: postalCode },
        radius,
        actionUrl,
        apiKey
    );
    
    // Dodaj informacije o inventory-ju
    result.stores = storesWithInventory;
    result.product = {
        id: product.ID,
        name: product.name
    };
    
    res.json(result);
    next();
});

module.exports = server.exports();