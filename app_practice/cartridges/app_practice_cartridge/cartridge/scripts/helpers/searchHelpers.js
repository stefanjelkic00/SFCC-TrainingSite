'use strict';

const base = module.superModule;
const urlHelper = require('*/cartridge/scripts/helpers/urlHelpers');

function addPageSizeToRefinements(productSearch, pageSize) {
    if (!productSearch || !productSearch.refinements || !pageSize) {
        return;
    }
    
    productSearch.refinements.forEach(function(refinement) {
        if (!refinement.values) {
            return;
        }
        
        refinement.values.forEach(function(value) {
            if (value.url && value.url !== '#') {
                value.url = urlHelper.appendQueryParams(value.url, { sz: pageSize });
            }
        });
    });
}

function search(req, res) {
    const result = base.search(req, res);
    
    if (req.querystring.sz) {
        if (result.refineurl) {
            result.refineurl.append('sz', req.querystring.sz);
        }
        
        if (result.productSearch) {
            addPageSizeToRefinements(result.productSearch, req.querystring.sz);
        }
    }

    return result;
}

module.exports = Object.assign({}, base, {
    search: search,
    addPageSizeToRefinements: addPageSizeToRefinements
});