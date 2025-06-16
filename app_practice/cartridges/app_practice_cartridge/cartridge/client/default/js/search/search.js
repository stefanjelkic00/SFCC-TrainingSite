'use strict';

const baseSearch = require('app_storefront_base/js/search/search');

baseSearch.seoAttributeFilter = function() {
    $('.container').on('click', '[data-seo-href]', function (e) {
        const seoUrl = $(this).data('seo-href');
        const searchUrl = $(this).data('href');
        
        if (seoUrl && seoUrl !== '#' && seoUrl !== searchUrl) {
            e.preventDefault();
            $.spinner().start();
            $(this).trigger('search:filter', e);
            
            $.ajax({
                url: searchUrl,
                data: { 
                    page: $('.grid-footer').data('page-number'),
                    selectedUrl: searchUrl 
                },
                success: function (response) {
                    $('.product-grid').html($(response).find('.product-grid').html());
                    $('.refinements').html($(response).find('.refinements').html());
                    window.history.pushState({}, null, seoUrl);
                    $.spinner().stop();
                },
                error: function () {
                    $.spinner().stop();
                }
            });
        }
    });
};

$(document).ready(function() {
    ['filter', 'closeRefinements', 'resize', 'sort', 'showMore', 'applyFilter', 'showContentTab']
        .forEach(method => baseSearch[method]());
    
    baseSearch.seoAttributeFilter();
});

module.exports = baseSearch;