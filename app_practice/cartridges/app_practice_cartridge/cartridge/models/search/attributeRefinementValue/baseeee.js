'use strict';

const BaseAttributeValueCore = require('app_storefront_base/cartridge/models/search/attributeRefinementValue/base');

BaseAttributeValueCore.prototype.seoRefineEndpoint = 'Search-Show';

const originalGetUrl = BaseAttributeValueCore.prototype.getUrl;

BaseAttributeValueCore.prototype.getUrl = function (productSearch, actionEndpoint, id, value, selected, selectable) {
    return originalGetUrl.call(this, productSearch, actionEndpoint, id, value, selected, selectable);
};

module.exports = BaseAttributeValueCore;