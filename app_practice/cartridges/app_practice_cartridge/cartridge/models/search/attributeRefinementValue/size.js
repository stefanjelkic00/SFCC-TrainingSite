'use strict';

const BaseAttributeValue = require('*/cartridge/models/search/attributeRefinementValue/base');

function SizeAttributeValue(productSearch, refinementDefinition, refinementValue) {
    this.productSearch = productSearch;
    this.refinementDefinition = refinementDefinition;
    this.refinementValue = refinementValue;
    this.initialize();
}

SizeAttributeValue.prototype = Object.create(BaseAttributeValue.prototype);

SizeAttributeValue.prototype.initialize = function () {
    BaseAttributeValue.prototype.initialize.call(this);

    this.type = 'size';
    this.displayValue = this.getDisplayValue(this.refinementValue);
    
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

function SizeRefinementValueWrapper(productSearch, refinementDefinition, refinementValue) {
    const value = new SizeAttributeValue(productSearch, refinementDefinition, refinementValue);
    
    const items = [
        'id',
        'type',
        'displayValue',
        'presentationId',
        'selected',
        'selectable',
        'title',
        'url',
        'seoRefineUrl'
    ];
    
    items.forEach(function (item) {
        this[item] = value[item];
    }, this);
}

module.exports = SizeRefinementValueWrapper;