'use strict';

const base = module.superModule;
const StoreModel = require('*/cartridge/models/store');
const renderTemplateHelper = require('*/cartridge/scripts/renderTemplateHelper');

function getStoresWithInventory(stores, productId) {
    const ProductInventoryMgr = require('dw/catalog/ProductInventoryMgr');
    const StoreMgr = require('dw/catalog/StoreMgr');
    
    return stores.filter(function(store) {
        const storeObj = StoreMgr.getStore(store.ID);
        if (!storeObj) {
            return false;
        }
        
        const inventory = ProductInventoryMgr.getInventoryList(storeObj.inventoryListID);
        if (!inventory) {
            return false;
        }
        
        const record = inventory.getRecord(productId);
        if (record && record.ATS && record.ATS.value > 0) {
            store.availableQuantity = record.ATS.value;
            return true;
        }
        return false;
    });
}

function createStoreFinderResultsHtml(storesInfo) {
    var HashMap = require('dw/util/HashMap');
    var Template = require('dw/util/Template');

    var context = new HashMap();
    context.put('stores', storesInfo);

    var template = new Template('product/storeFinderResults');
    return template.render(context).text;
}

function createGeoLocationObjectWithInventory(storesObject) {
    var context;
    var template = 'product/productStoreInfoWindow';
    return Object.keys(storesObject).map(function (key) {
        var store = storesObject[key];
        context = { store: store };
        return {
            name: store.name,
            latitude: store.latitude,
            longitude: store.longitude,
            availableQuantity: store.availableQuantity,
            infoWindowHtml: renderTemplateHelper.getRenderedHtml(context, template)
        };
    });
}

function getStoresWithInventoryClean(radius, postalCode, lat, long, geolocation, showMap, productId) {
    const StoreMgr = require('dw/catalog/StoreMgr');
    const storeSearchResult = base.getStores(radius, postalCode, lat, long, geolocation, showMap);
    
    if (!productId || !storeSearchResult.stores) {
        return {
            stores: [],
            radius: radius,
            searchKey: { postalCode: postalCode },
            googleMapsApi: storeSearchResult.googleMapsApi
        };
    }
    
    const storesWithInventory = getStoresWithInventory(storeSearchResult.stores, productId);
    
    const storeModels = storesWithInventory.map(function(store) {
        const storeObj = StoreMgr.getStore(store.ID);
        const inventoryData = {
            availableQuantity: store.availableQuantity, 
            inventoryListID: storeObj.inventoryListID
        };
        
        return new StoreModel(storeObj, inventoryData);
    });
    
    const locations = createGeoLocationObjectWithInventory(storeModels);
    
    return {
        stores: storeModels,
        locations: JSON.stringify(locations),
        storesResultsHtml: storeModels.length ? createStoreFinderResultsHtml(storeModels) : null,
        radius: storeSearchResult.radius,
        searchKey: storeSearchResult.searchKey,
        googleMapsApi: storeSearchResult.googleMapsApi
    };
}

module.exports = Object.assign({}, base, {
    getStoresWithInventory: getStoresWithInventory,
    getStoresWithInventoryClean: getStoresWithInventoryClean,
    createStoreFinderResultsHtml: createStoreFinderResultsHtml
});