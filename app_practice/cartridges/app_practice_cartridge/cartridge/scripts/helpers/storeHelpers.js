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
    const ProductInventoryMgr = require('dw/catalog/ProductInventoryMgr');
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
    
    const storesWithInventory = storeSearchResult.stores
        .map(function(store) {
            const storeObj = StoreMgr.getStore(store.ID);
            if (!storeObj) {
                return null;
            }
            
            const inventory = ProductInventoryMgr.getInventoryList(storeObj.inventoryListID);
            if (!inventory) {
                return null;
            }
            
            const record = inventory.getRecord(productId);
            if (record && record.ATS && record.ATS.value > 0) {
                const inventoryData = {
                    availableQuantity: record.ATS.value,
                    inventoryListID: storeObj.inventoryListID
                };
                
                return new StoreModel(storeObj, inventoryData);
            }
            return null;
        })
        .filter(function(store) {
            return store !== null;
        });
    
    return {
        stores: storesWithInventory,
        radius: storeSearchResult.radius,
        searchKey: storeSearchResult.searchKey,
        googleMapsApi: storeSearchResult.googleMapsApi
    };
}

function addInfoWindowHtml(stores) {
    const HashMap = require('dw/util/HashMap');
    const Template = require('dw/util/Template');
    const template = new Template('storeLocator/storeInfoWindow');
    
    stores.forEach(function(store) {
        const context = new HashMap();
        context.put('store', store);
        store.infoWindowHtml = template.render(context).text;
    });
}

module.exports = Object.assign({}, base, {
    getStoresWithInventory: getStoresWithInventory,
    getStoresWithInventoryClean: getStoresWithInventoryClean,
    addInfoWindowHtml: addInfoWindowHtml
});