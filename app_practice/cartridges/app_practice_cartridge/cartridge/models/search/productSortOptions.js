'use strict';

const collections = require('*/cartridge/scripts/util/collections');
const urlHelper = require('*/cartridge/scripts/helpers/urlHelpers');
const ACTION_ENDPOINT = 'Search-UpdateGrid';

function getSortingOptions(productSearch, sortingOptions, pagingModel) {
    return collections.map(sortingOptions, function (option) {
        const baseUrl = productSearch.urlSortingRule(ACTION_ENDPOINT, option.sortingRule);
        const pagingParams = {
            start: '0',
            sz: pagingModel.end + 1
        };
        
        const ajaxUrl = urlHelper.appendQueryParams(baseUrl.toString(), pagingParams).toString();
        
        return {
            displayName: option.displayName,
            id: option.ID,
            url: ajaxUrl,
            ajaxUrl: ajaxUrl,
            sortRuleId: option.sortingRule.ID
        };
    });
}

function getSortRuleDefault(productSearch, rootCategory) {
    const category = productSearch.category ? productSearch.category : rootCategory;
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