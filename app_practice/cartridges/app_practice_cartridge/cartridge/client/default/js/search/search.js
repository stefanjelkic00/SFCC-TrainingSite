'use strict';

const baseSearch = require('app_storefront_base/search/search');

function parseResults(response) {
    const $results = $(response);
    
    ['.grid-header', '.header-bar', '.header.page-title', '.product-grid', '.show-more', '.filter-bar'].forEach(function(selector) {
        const $updates = $results.find(selector);
        $(selector).empty().html($updates.html());
    });
    
    $('.refinement.active').each(function() {
        $(this).removeClass('active');
        const activeDiv = $results.find('.' + $(this)[0].className.replace(/ /g, '.'));
        activeDiv.addClass('active');
        activeDiv.find('button.title').attr('aria-expanded', 'true');
    });
    
    const $updates = $results.find('.refinements');
    $('.refinements').empty().html($updates.html());
    
    const $paginationWrapper = $results.find('.pagination-wrapper');
    if ($paginationWrapper.length > 0) {
        $('.pagination-wrapper').replaceWith($paginationWrapper);
    } else {
        $('.pagination-wrapper').remove();
    }
}

baseSearch.applyFilter = function() {
    $('.container').on('click', '.refinements li button, .refinement-bar button.reset, .filter-value button, .swatch-filter button', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        $.spinner().start();
        $(this).trigger('search:filter', e);
        const attributeId = '#' + $(this).find('span').last().attr('id');
        
        $.ajax({
            url: $(this).data('href'),
            data: {
                page: $('.grid-footer').data('page-number'),
                selectedUrl: $(this).data('href')
            },
            method: 'GET',
            success: function(response) {
                parseResults(response);  
                
                const serverUrl = $(response).find('.permalink').val();
                if (serverUrl) {
                    window.history.replaceState({}, null, serverUrl);
                }
                
                $.spinner().stop();
                $(attributeId).parent('button').focus();
            },
            error: function() {
                $.spinner().stop();
                $(attributeId).parent('button').focus();
            }
        });
    });
};

baseSearch.sort = function() {
    $('.container').on('change', '[name=sort-order]', function(e) {
        e.preventDefault();
        
        $.spinner().start();
        $(this).trigger('search:sort', this.value);
        
        $.ajax({
            url: this.value,
            data: { selectedUrl: this.value },
            method: 'GET',
            success: function(response) {
                parseResults(response); 
                
                const serverUrl = $(response).find('.permalink').val();
                if (serverUrl) {
                    window.history.replaceState({}, null, serverUrl);
                }
                
                $.spinner().stop();
            },
            error: function() {
                $.spinner().stop();
            }
        });
    });
};

//DISABLE SHOW MORE (zamenjuje ga paginacija, moze da bude tu a i ne mora...)
baseSearch.showMore = function() {
    return; 
};

baseSearch.pagination = function() {
    $('.container').on('click', '.pagination-link', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const url = $(this).attr('href');
        const page = $(this).data('page');
        
        $.spinner().start();
        $(this).trigger('search:pagination', { page: page, url: url });
        
        $.ajax({
            url: url,
            method: 'GET',
            success: function(response) {
                parseResults(response); 
                
                const serverUrl = $(response).find('.permalink').val();
                if (serverUrl) {
                    window.history.pushState({}, null, serverUrl);
                }
                
                $('html, body').animate({
                    scrollTop: $('.product-grid').offset().top - 100
                }, 300);
                
                $.spinner().stop();
            },
            error: function() {
                $.spinner().stop();
            }
        });
    });
};

$(document).ready(function() {
    baseSearch.pagination();
});

module.exports = baseSearch;