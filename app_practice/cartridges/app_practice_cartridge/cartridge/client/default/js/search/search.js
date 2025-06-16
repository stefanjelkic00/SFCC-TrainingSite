'use strict';

var baseSearch = require('app_storefront_base/js/search/search');

$(document).ready(function() {
    baseSearch.filter();
    baseSearch.closeRefinements();
    baseSearch.resize();
    baseSearch.sort();
    baseSearch.showMore();
    baseSearch.applyFilter(); 
    baseSearch.showContentTab();
    
    $('.container').on('click', '.color-attribute button', function (e) {
        var seoUrl = $(this).data('seo-href');
        var searchUrl = $(this).data('href');
        
        if (seoUrl && seoUrl !== '#' && seoUrl !== searchUrl) {
            window.history.pushState({}, null, seoUrl);
        }
    });
});

module.exports = baseSearch;