'use strict';

const baseSearch = require('app_storefront_base/js/search/search');

function parseResults(response) {
   const $results = $(response);
   
   [
       '.grid-header',
       '.header-bar',
       '.header.page-title',
       '.product-grid',
       '.show-more',
       '.filter-bar'
   ].forEach(function (selector) {
       const $updates = $results.find(selector);
       $(selector).empty().html($updates.html());
   });

   $('.refinement.active').each(function () {
       $(this).removeClass('active');
       const activeDiv = $results.find('.' + $(this)[0].className.replace(/ /g, '.'));
       activeDiv.addClass('active');
       activeDiv.find('button.title').attr('aria-expanded', 'true');
   });
   
   const $refinements = $results.find('.refinements');
   $('.refinements').empty().html($refinements.html());
}

Object.assign(baseSearch, {
   sort: function () {
       $('.container').on('change', '[name=sort-order]', function (e) {
           e.preventDefault();
           $.spinner().start();
           $(this).trigger('search:sort', this.value);
           
           const $option = $(this).find('option:selected');
           const ajaxUrl = $option.data('ajax-url');
           const sortRuleId = $option.data('sort-rule');
           
           $.ajax({
               url: ajaxUrl,
               data: { selectedUrl: ajaxUrl },
               method: 'GET',
               success: function (response) {
                   $('.product-grid').empty().html(response);
                   
                   const currentUrl = window.location.pathname + window.location.search;
                   const newUrl = baseSearch.addSortToSeoUrl(currentUrl, ajaxUrl);
                   window.history.pushState({}, null, newUrl);
                   
                   $.spinner().stop();
               }.bind(this),
               error: function () {
                   $.spinner().stop();
               }
           });
       });
   },

   applyFilter: function () {
       $('.container').on(
           'click',
           '.refinements li button, .refinement-bar button.reset, .filter-value button, .swatch-filter button',
           function (e) {
               e.preventDefault();
               e.stopPropagation();

               $.spinner().start();
               $(this).trigger('search:filter', e);
               
               const searchUrl = $(this).data('href');
               let seoUrl = $(this).data('seo-href') || searchUrl;
               const attributeId = '#' + $(this).find('span').last().attr('id');
               
               if (seoUrl !== searchUrl) {
                   seoUrl = baseSearch.enhanceUrlWithCurrentParams(seoUrl);
               }
               
               $.ajax({
                   url: searchUrl,
                   data: {
                       page: $('.grid-footer').data('page-number'),
                       selectedUrl: searchUrl
                   },
                   method: 'GET',
                   success: function (response) {
                       parseResults(response);
                       window.history.pushState({}, null, seoUrl);
                       $.spinner().stop();
                       $(attributeId).parent('button').focus();
                   },
                   error: function () {
                       $.spinner().stop();
                       $(attributeId).parent('button').focus();
                   }
               });
           }
       );
   },

   addSortToSeoUrl: function(currentUrl, sortUrl) {
       const sortMatch = sortUrl.match(/srule=([^&]+)/);
       if (!sortMatch) return currentUrl;
       
       const sortValue = sortMatch[1];
       const urlParts = currentUrl.split('?');
       const path = urlParts[0];
       const queryString = urlParts[1] || '';
       
       const params = new URLSearchParams(queryString);
       params.set('srule', sortValue);
       
       return path + '?' + params.toString();
   },

    enhanceUrlWithCurrentParams: function(baseUrl) {
        const currentParams = new URLSearchParams(window.location.search);
        const baseUrlObj = new URL(baseUrl, window.location.origin);
        const baseParams = baseUrlObj.searchParams;
        const preserveParams = ['srule', 'lang', 'sz'];
        
        preserveParams.forEach(function(param) {
            if (currentParams.has(param) && !baseParams.has(param)) {
                baseParams.set(param, currentParams.get(param));
            }
        });
        
        return baseUrlObj.pathname + (baseParams.toString() ? '?' + baseParams.toString() : '');
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