'use strict';

const server = require('server');
const searchHelpers = require('*/cartridge/scripts/helpers/searchHelpers');

server.extend(module.superModule);

server.append('Refinebar', function (req, res, next) {
    if (req.querystring.sz && res.viewData.productSearch) {
        searchHelpers.addPageSizeToRefinements(res.viewData.productSearch, req.querystring.sz);
    }
    
    next();
});


module.exports = server.exports();