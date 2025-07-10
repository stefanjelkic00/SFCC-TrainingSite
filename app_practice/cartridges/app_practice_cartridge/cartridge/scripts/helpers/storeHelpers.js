'use strict';

const base = module.superModule;
const StoreModel = require('*/cartridge/models/store');

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
    
    return {
        stores: storeModels,
        radius: storeSearchResult.radius,
        searchKey: storeSearchResult.searchKey,
        googleMapsApi: storeSearchResult.googleMapsApi
    };
}

module.exports = Object.assign({}, base, {
    getStoresWithInventory: getStoresWithInventory,
    getStoresWithInventoryClean: getStoresWithInventoryClean,
});