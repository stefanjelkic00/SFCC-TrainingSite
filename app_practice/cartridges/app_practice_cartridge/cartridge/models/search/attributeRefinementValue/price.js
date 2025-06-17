'use strict';

const BaseAttributeValue = require('*/cartridge/models/search/attributeRefinementValue/base');

function PriceAttributeValue(productSearch, refinementDefinition, refinementValue) {
    this.productSearch = productSearch;
    this.refinementDefinition = refinementDefinition;
    this.refinementValue = refinementValue;
    this.initialize();
}

PriceAttributeValue.prototype = Object.create(BaseAttributeValue.prototype);

PriceAttributeValue.prototype.initialize = function () {
    BaseAttributeValue.prototype.initialize.call(this);

    this.type = 'price';
    this.valueFrom = this.refinementValue.valueFrom;
    this.valueTo = this.refinementValue.valueTo;
    this.displayValue = this.refinementValue.displayValue;
    
    this.selected = this.isSelected(this.productSearch, this.valueFrom, this.valueTo);
    
    this.url = this.getUrl(
        this.productSearch,
        this.actionEndpoint,
        this.selected,
        this.valueFrom,
        this.valueTo
    );
    
    this.seoRefineUrl = this.getSeoUrl(
        this.productSearch,
        this.seoRefineEndpoint,
        this.selected,
        this.valueFrom,
        this.valueTo
    );
    
    this.title = this.getTitle(
        this.selected,
        this.selectable,
        this.refinementDefinition.displayName,
        this.displayValue
    );
};

/**
 * Forms URL for this price refinement value
 */
PriceAttributeValue.prototype.getUrl = function (
    productSearch,
    actionEndpoint,
    selected,
    valueFrom,
    valueTo
) {
    return selected
        ? productSearch.urlRelaxPrice(actionEndpoint).relative().toString()
        : productSearch.urlRefinePrice(actionEndpoint, valueFrom, valueTo).relative().toString();
};

/**
 * Forms SEO URL for this price refinement value
 */
PriceAttributeValue.prototype.getSeoUrl = function (
    productSearch,
    actionEndpoint,
    selected,
    valueFrom,
    valueTo
) {
    return selected
        ? productSearch.urlRelaxPrice(actionEndpoint).relative().toString()
        : productSearch.urlRefinePrice(actionEndpoint, valueFrom, valueTo).relative().toString();
};

/**
 * Determines whether this price refinement value has been selected
 */
PriceAttributeValue.prototype.isSelected = function (productSearch, valueFrom, valueTo) {
    return productSearch.isRefinedByPriceRange(valueFrom, valueTo);
};

function PriceRefinementValueWrapper(productSearch, refinementDefinition, refinementValue) {
    const value = new PriceAttributeValue(productSearch, refinementDefinition, refinementValue);
    
    const items = [
        'displayValue',
        'selected',
        'title',
        'url',
        'seoRefineUrl'
    ];
    
    items.forEach(function (item) {
        this[item] = value[item];
    }, this);
}

module.exports = PriceRefinementValueWrapper;