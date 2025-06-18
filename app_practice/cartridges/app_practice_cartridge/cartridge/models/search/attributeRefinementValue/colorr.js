'use strict';

const BaseAttributeValue = require('*/cartridge/models/search/attributeRefinementValue/base');

function ColorAttributeValue(productSearch, refinementDefinition, refinementValue) {
    this.productSearch = productSearch;
    this.refinementDefinition = refinementDefinition;
    this.refinementValue = refinementValue;
    this.initialize();
}

ColorAttributeValue.prototype = Object.create(BaseAttributeValue.prototype);

ColorAttributeValue.prototype.initialize = function () {
    BaseAttributeValue.prototype.initialize.call(this);
    
    this.type = 'color';
    this.displayValue = this.getDisplayValue(this.refinementValue);
    this.swatchId = 'swatch-circle-' + this.presentationId;
    
    this.selected = this.isSelected(
        this.productSearch,
        this.refinementDefinition.attributeID,
        this.refinementValue.value
    );
    
    this.url = this.getUrl(
        this.productSearch,
        this.actionEndpoint,
        this.id,
        this.value,
        this.selected,
        this.selectable
    );
    
    this.seoRefineUrl = this.getUrl(
        this.productSearch,
        this.seoRefineEndpoint,
        this.id,
        this.value,
        this.selected,
        this.selectable
    );
    
    this.title = this.getTitle(
        this.selected,
        this.selectable,
        this.refinementDefinition.displayName,
        this.displayValue
    );
};

function ColorRefinementValueWrapper(productSearch, refinementDefinition, refinementValue) {
    const value = new ColorAttributeValue(productSearch, refinementDefinition, refinementValue);
    
    const items = [
        'id',
        'type',
        'displayValue',
        'presentationId',
        'selected',
        'selectable',
        'swatchId',
        'title',
        'url',
        'seoRefineUrl'
    ];
    
    items.forEach(function (item) {
        this[item] = value[item];
    }, this);
}

module.exports = ColorRefinementValueWrapper;