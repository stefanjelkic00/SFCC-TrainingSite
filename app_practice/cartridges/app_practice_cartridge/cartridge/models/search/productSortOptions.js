'use strict';

var collections = require('*/cartridge/scripts/util/collections');
var urlHelper = require('*/cartridge/scripts/helpers/urlHelpers');

var ACTION_ENDPOINT = 'Search-UpdateGrid';

function getSortingOptions(productSearch, sortingOptions, pagingModel) {
    return collections.map(sortingOptions, function (option) {
        var baseUrl = productSearch.urlSortingRule(ACTION_ENDPOINT, option.sortingRule);
        var pagingParams = {
            start: '0',
            sz: pagingModel.pageSize 
        };
        return {
            displayName: option.displayName,
            id: option.ID,
            url: urlHelper.appendQueryParams(baseUrl.toString(), pagingParams).toString()
        };
    });
}

function getSortRuleDefault(productSearch, rootCategory) {
    var category = productSearch.category ? productSearch.category : rootCategory;
    return category.defaultSortingRule ? category.defaultSortingRule.ID : null;
}

function ProductSortOptions(
    productSearch,
    sortingRuleId,
    sortingOptions,
    rootCategory,
    pagingModel
) {
    this.options = getSortingOptions(productSearch, sortingOptions, pagingModel);
    this.ruleId = sortingRuleId || getSortRuleDefault(productSearch, rootCategory);
}

module.exports = ProductSortOptions;