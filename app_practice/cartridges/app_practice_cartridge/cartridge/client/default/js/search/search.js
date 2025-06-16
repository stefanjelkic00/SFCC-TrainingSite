'use strict';

const baseSearch = require('app_storefront_base/js/search/search');

function parseResults(response) {
    var $results = $(response);
    
    [
        '.grid-header',
        '.header-bar',
        '.header.page-title',
        '.product-grid',
        '.show-more',
        '.filter-bar'
    ].forEach(function (selector) {
        var $updates = $results.find(selector);
        $(selector).empty().html($updates.html());
    });

    $('.refinement.active').each(function () {
        $(this).removeClass('active');
        var activeDiv = $results.find('.' + $(this)[0].className.replace(/ /g, '.'));
        activeDiv.addClass('active');
        activeDiv.find('button.title').attr('aria-expanded', 'true');
    });
    
    var $refinements = $results.find('.refinements');
    $('.refinements').empty().html($refinements.html());
}

Object.assign(baseSearch, {
    seoAttributeFilter: function() {
        $('.container').on('click', '[data-seo-href]', function (e) {
            const seoUrl = $(this).data('seo-href');
            const searchUrl = $(this).data('href');
            
            if (seoUrl && seoUrl !== '#' && seoUrl !== searchUrl) {
                e.preventDefault();
                $.spinner().start();
                
                $.ajax({
                    url: searchUrl,
                    data: { 
                        page: $('.grid-footer').data('page-number'),
                        selectedUrl: searchUrl 
                    },
                    success: function (response) {
                        parseResults(response);
                        window.history.pushState({}, null, seoUrl);
                        $.spinner().stop();
                    },
                    error: function () {
                        $.spinner().stop();
                    }
                });
            }
        });
    }
});

$(document).ready(function() {
    Object.keys(baseSearch).forEach(function(methodName) {
        if (typeof baseSearch[methodName] === 'function') {
            baseSearch[methodName]();
        }
    });
});

module.exports = baseSearch;