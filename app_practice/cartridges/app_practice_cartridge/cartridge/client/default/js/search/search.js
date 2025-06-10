'use strict';

console.log('CUSTOM SEARCH.JS LOADED FROM APP_PRACTICE_CARTRIDGE!');

// Import base search module properly
var base = module.superModule;

/**
 * Deep Linking functionality for color refinements
 * Task 10: Transform ?prefn1=color&prefv1=red -> /color/red
 */
var DeepLinking = {
    specialFilters: ['refinementColor', 'color'], // Add both possible values
    
    parseURL: function() {
        var url = new URL(window.location.href);
        var pathParts = url.pathname.split('/').filter(function(part) { return part !== ''; });
        var pathFilters = {};
        var baseParts = [];
        
        for (var i = 0; i < pathParts.length; i++) {
            if (pathParts[i] === 'color' && pathParts[i + 1]) {
                pathFilters.color = decodeURIComponent(pathParts[i + 1]);
                i++; // Skip value part
            } else {
                baseParts.push(pathParts[i]);
            }
        }
        
        return {
            pathFilters: pathFilters,
            basePath: '/' + baseParts.join('/')
        };
    },
    
    generatePrettyURL: function(filterName, filterValue, isAdd) {
        var state = this.parseURL();
        var pathParts = state.basePath.split('/').filter(function(part) { return part !== ''; });
        
        // Only handle color filters for pretty URLs
        if ((filterName === 'refinementColor' || filterName === 'color') && isAdd && filterValue) {
            pathParts.push('color', encodeURIComponent(filterValue));
            return '/' + pathParts.join('/');
        }
        
        return window.location.pathname;
    },
    
    extractFilterInfo: function($element, href) {
        try {
            var url = new URL(href, window.location.origin);
            var filterName = null;
            var filterValue = null;
            
            // Check for refinement parameters
            url.searchParams.forEach(function(value, key) {
                if (key.startsWith('prefn')) {
                    filterName = value;
                } else if (key.startsWith('prefv')) {
                    filterValue = value;
                }
            });
            
            // Determine if this is adding or removing a filter
            var isAdd = !($element.hasClass('reset') || 
                         $element.attr('aria-pressed') === 'true' ||
                         $element.closest('.filter-value').length > 0);
            
            console.log('Extracted filter info:', { name: filterName, value: filterValue, isAdd: isAdd });
            
            return {
                name: filterName,
                value: filterValue,
                isAdd: isAdd,
                href: href
            };
        } catch (error) {
            console.error('Error extracting filter info:', error);
            return null;
        }
    },
    
    updateURL: function(newURL) {
        console.log('Deep linking: Updating URL from', window.location.pathname, 'to:', newURL);
        if (newURL !== window.location.pathname) {
            window.history.pushState({ deepLink: true }, '', newURL);
        }
    }
};

/**
 * Enhanced applyFilter function with deep linking
 */
function enhancedApplyFilter() {
    console.log('Enhanced applyFilter function initialized');
    
    $('.container').on(
        'click',
        '.refinements li button, .refinement-bar button.reset, .filter-value button, .swatch-filter button',
        function (e) {
            e.preventDefault();
            e.stopPropagation();

            var $button = $(this);
            var href = $button.data('href');
            
            if (!href) {
                console.warn('No href found on button');
                return;
            }

            console.log('Filter clicked, href:', href);
            
            // Deep linking logic for color filters
            var filterInfo = DeepLinking.extractFilterInfo($button, href);
            
            if (filterInfo && 
                (filterInfo.name === 'refinementColor' || filterInfo.name === 'color') && 
                filterInfo.isAdd && 
                filterInfo.value) {
                
                console.log('Color filter detected, applying deep linking');
                var newURL = DeepLinking.generatePrettyURL(
                    filterInfo.name, 
                    filterInfo.value, 
                    filterInfo.isAdd
                );
                DeepLinking.updateURL(newURL);
            }

            // Execute original AJAX logic
            $.spinner().start();
            $button.trigger('search:filter', e);
            
            var attributeId = '#' + $button.find('span').last().attr('id');
            
            $.ajax({
                url: href,
                data: {
                    page: $('.grid-footer').data('page-number'),
                    selectedUrl: href
                },
                method: 'GET',
                success: function (response) {
                    // Use parseResults function (should be available globally or from base)
                    if (typeof parseResults === 'function') {
                        parseResults(response);
                    } else if (base && base.parseResults) {
                        base.parseResults(response);
                    } else {
                        console.warn('parseResults function not found, updating manually');
                        $('.product-grid').html($(response).find('.product-grid').html());
                        $('.refinements').html($(response).find('.refinements').html());
                        $('.grid-header').html($(response).find('.grid-header').html());
                    }
                    $.spinner().stop();
                    $(attributeId).parent('button').focus();
                },
                error: function () {
                    console.error('AJAX error in filter request');
                    $.spinner().stop();
                    $(attributeId).parent('button').focus();
                }
            });
        }
    );
}

/**
 * Initialize deep linking on page load
 */
function initDeepLinking() {
    console.log('Initializing deep linking...');
    
    // Convert path parameters to query parameters for server compatibility
    var state = DeepLinking.parseURL();
    if (Object.keys(state.pathFilters).length > 0) {
        console.log('Converting path filters to query parameters:', state.pathFilters);
        var url = new URL(window.location.href);
        var paramIndex = 1;
        
        // Convert color path param to query param
        if (state.pathFilters.color) {
            url.searchParams.set('prefn' + paramIndex, 'refinementColor');
            url.searchParams.set('prefv' + paramIndex, state.pathFilters.color);
            
            // Update URL without reload and then reload to show filtered results
            window.history.replaceState({ converted: true }, '', url.toString());
            console.log('Reloading page with converted parameters');
            window.location.reload();
        }
    }
    
    // Handle browser back/forward
    $(window).on('popstate', function(event) {
        console.log('Popstate event detected, reloading page');
        window.location.reload();
    });
}

// Export enhanced module
module.exports = {
    // Keep all base functionality
    filter: base ? base.filter : function() {},
    closeRefinements: base ? base.closeRefinements : function() {}, 
    resize: base ? base.resize : function() {},
    sort: base ? base.sort : function() {},
    showMore: base ? base.showMore : function() {},
    showContentTab: base ? base.showContentTab : function() {},
    
    // Override applyFilter with enhanced version
    applyFilter: enhancedApplyFilter,
    
    // Add initialization
    init: function() {
        console.log('Search module initializing with deep linking...');
        
        // Call base init if available
        if (base && base.init && typeof base.init === 'function') {
            base.init();
        }
        
        // Initialize deep linking
        initDeepLinking();
    }
};