'use strict';

const BaseAttributeValueCore = require('app_storefront_base/cartridge/models/search/attributeRefinementValue/base');
const SEO_REFINE_ENDPOINT = 'Search-Show';

function BaseAttributeValue(productSearch, refinementDefinition, refinementValue) {
    this.productSearch = productSearch;
    this.refinementDefinition = refinementDefinition;
    this.refinementValue = refinementValue;
    
    this.initialize();
}

BaseAttributeValue.prototype = Object.assign({}, BaseAttributeValueCore.prototype, {
    initialize: function () {
        this.id = this.refinementValue.ID;
        this.presentationId = this.refinementValue.presentationID;
        this.value = this.refinementValue.value;
        this.hitCount = this.refinementValue.hitCount;
        this.selectable = this.refinementValue.hitCount > 0;
        this.actionEndpoint = BaseAttributeValueCore.actionEndpoint;
        
        this.seoRefineEndpoint = SEO_REFINE_ENDPOINT;
    }
});

module.exports = BaseAttributeValue;
module.exports.actionEndpoint = BaseAttributeValueCore.actionEndpoint;
module.exports.seoRefineEndpoint = SEO_REFINE_ENDPOINT;