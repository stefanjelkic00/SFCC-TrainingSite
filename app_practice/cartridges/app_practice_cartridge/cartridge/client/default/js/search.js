'use strict';

console.log('CUSTOM MAIN SEARCH.JS ENTRY POINT LOADED!');

var processInclude = require('./util');

$(document).ready(function () {
    console.log('Processing search module includes...');
    processInclude(require('./search/search')); // This loads your custom search.js
    processInclude(require('./product/quickView'));
    console.log('Search modules loaded successfully');
});