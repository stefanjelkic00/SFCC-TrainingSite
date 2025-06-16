'use strict';

const baseSearch = require('app_storefront_base/js/search/search');

baseSearch.colorAttribute = function() {
    $('.container').on('click', '.color-attribute button', function (e) {
        e.preventDefault();
        const seoUrl = $(this).data('seo-href');
        const searchUrl = $(this).data('href');
        
        if (seoUrl && seoUrl !== '#' && seoUrl !== searchUrl) {
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
    
    baseSearch.colorAttribute();
});

module.exports = baseSearch;