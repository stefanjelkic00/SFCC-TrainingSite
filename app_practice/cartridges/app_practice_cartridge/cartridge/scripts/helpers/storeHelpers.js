'use strict';

const base = module.superModule;
const StoreModel = require('*/cartridge/models/store');
const StoresModel = require('*/cartridge/models/stores'); 

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

    const HashMap = require('dw/util/HashMap');

    const Template = require('dw/util/Template');

    const context = new HashMap();
    
    context.put('stores', storesInfo);

    const template = new Template('product/storeFinderResults');
    return template.render(context).text;
}

function getStoresWithInventoryClean(radius, postalCode, lat, long, geolocation, showMap, productId) {
    const Site = require('dw/system/Site');
    const URLUtils = require('dw/web/URLUtils');
    const StoreMgr = require('dw/catalog/StoreMgr');
    
    const storeSearchResult = base.getStores(radius, postalCode, lat, long, geolocation, showMap);
    
    if (!productId || !storeSearchResult.stores) {
        return storeSearchResult;
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
    
    const actionUrl = URLUtils.url('Stores-InventorySearch').toString();
    const apiKey = Site.getCurrent().getCustomPreferenceValue('mapAPI');
    
    const storesModel = new StoresModel(
        storeModels, 
        storeSearchResult.searchKey,
        storeSearchResult.radius,
        actionUrl,
        apiKey
    );
    
    return storesModel; 
}

module.exports = Object.assign({}, base, {
    getStoresWithInventory: getStoresWithInventory,
    getStoresWithInventoryClean: getStoresWithInventoryClean,
    createStoreFinderResultsHtml: createStoreFinderResultsHtml
});