'use strict';

const BaseAttributeValue = require('*/cartridge/models/search/attributeRefinementValue/base');
const Resource = require('dw/web/Resource');

function BooleanAttributeValue(productSearch, refinementDefinition, refinementValue) {
    this.productSearch = productSearch;
    this.refinementDefinition = refinementDefinition;
    this.refinementValue = refinementValue;
    this.initialize();
}

BooleanAttributeValue.prototype = Object.create(BaseAttributeValue.prototype);

BooleanAttributeValue.prototype.initialize = function () {
    BaseAttributeValue.prototype.initialize.call(this);

    this.type = 'boolean';
    this.displayValue = this.getDisplayValue(
        this.refinementDefinition.attributeID,
        this.refinementValue.displayValue
    );
    
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

BooleanAttributeValue.prototype.getDisplayValue = function (attributeID, displayValue) {
    return Resource.msg(
        ['label.refinement', attributeID, displayValue].join('.'),
        'search',
        displayValue
    );
};

function BooleanRefinementValueWrapper(productSearch, refinementDefinition, refinementValue) {
    const value = new BooleanAttributeValue(productSearch, refinementDefinition, refinementValue);
    
    const items = [
        'id',
        'type',
        'displayValue',
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

module.exports = BooleanRefinementValueWrapper;