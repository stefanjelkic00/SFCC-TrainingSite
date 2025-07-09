'use strict';

const base = module.superModule;

function getStoresWithInventory(stores, productId) {
    const ProductInventoryMgr = require('dw/catalog/ProductInventoryMgr');
    const StoreMgr = require('dw/catalog/StoreMgr');
    
    return stores.filter(function(store) {
        const storeObj = StoreMgr.getStore(store.ID);
        if (!storeObj) return false;
        
        const inventory = ProductInventoryMgr.getInventoryList(storeObj.inventoryListID);
        if (!inventory) return false;
        
        const record = inventory.getRecord(productId);
        if (record && record.ATS && record.ATS.value > 0) {
            store.availableQuantity = record.ATS.value;
            return true;
        }
        return false;
    });
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
    addInfoWindowHtml: addInfoWindowHtml
});