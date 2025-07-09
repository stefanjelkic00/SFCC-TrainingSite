'use strict';

const BaseStoreModel = require('app_storefront_base/cartridge/models/store');

function Store(storeObject, inventoryData) {
    BaseStoreModel.call(this, storeObject);
    
    if (inventoryData) {
        this.availableQuantity = inventoryData.availableQuantity || 0;
        this.inventoryListID = inventoryData.inventoryListID || null;
        this.isInStock = inventoryData.availableQuantity > 0;
    }
}

Store.prototype = Object.create(BaseStoreModel.prototype);
Store.prototype.constructor = Store;

module.exports = Store;