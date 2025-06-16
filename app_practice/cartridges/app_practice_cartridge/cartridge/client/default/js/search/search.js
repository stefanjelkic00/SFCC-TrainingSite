'use strict';

const baseSearch = require('app_storefront_base/js/search/search');

$(document).ready(function() {
    baseSearch.filter();
    baseSearch.closeRefinements();
    baseSearch.resize();
    baseSearch.sort();
    baseSearch.showMore();
    baseSearch.applyFilter(); 
    baseSearch.showContentTab();
    
    $('.container').on('click', '.color-attribute button', function (e) {
        const seoUrl = $(this).data('seo-href');
        const searchUrl = $(this).data('href');
        
        if (seoUrl && seoUrl !== '#' && seoUrl !== searchUrl) {
            window.history.pushState({}, null, seoUrl);
        }
    });
});

module.exports = baseSearch;