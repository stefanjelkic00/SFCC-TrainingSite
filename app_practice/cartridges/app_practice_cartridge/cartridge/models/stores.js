'use strict';

const renderTemplateHelper = require('*/cartridge/scripts/renderTemplateHelper');

function createGeoLocationObjectWithInventory(storesArray) {
    const template = 'product/productStoreInfoWindow';
    
    return storesArray.map(function (store) {
        const context = { store: store };
        return {
            name: store.name,
            latitude: store.latitude,
            longitude: store.longitude,
            infoWindowHtml: renderTemplateHelper.getRenderedHtml(context, template)
        };
    });
}

function Stores(storesResultsObject, searchKey, searchRadius, actionUrl, apiKey, isInventorySearch) {
    
    if (isInventorySearch) {
        this.searchKey = searchKey;
        this.radius = searchRadius;
        this.actionUrl = actionUrl;
        this.googleMapsApi = apiKey ? 'https://maps.googleapis.com/maps/api/js?key=' + apiKey : null;
        this.radiusOptions = [15, 30, 50, 100, 300];
        this.stores = storesResultsObject;
        this.locations = JSON.stringify(createGeoLocationObjectWithInventory(storesResultsObject));
        
        const storeHelpers = require('*/cartridge/scripts/helpers/storeHelpers');
        this.storesResultsHtml = storeHelpers.createStoreFinderResultsHtml(storesResultsObject);
    } else {
        const BaseStoresModel = require('app_storefront_base/cartridge/models/stores');
        BaseStoresModel.call(this, storesResultsObject, searchKey, searchRadius, actionUrl, apiKey);
    }
}

module.exports = Stores;