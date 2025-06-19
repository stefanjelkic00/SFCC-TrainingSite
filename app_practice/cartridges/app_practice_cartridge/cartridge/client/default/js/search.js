'use strict';

const processInclude = require('app_storefront_base/util'); 
$(document).ready(function () {
    processInclude(require('./search/search')); 
    processInclude(require('app_storefront_base/product/quickView')); 
});