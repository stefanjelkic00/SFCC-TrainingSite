'use strict';

var BaseProductSearch = require('app_storefront_base/cartridge/models/search/productSearch');

/**
 * @constructor
 * @classdesc ProductSearch class that extends base product search
 * @param {dw.catalog.ProductSearchModel} productSearch - Product search object  
 * @param {Object} httpParams - HTTP query parameters
 * @param {string} sortingRule - Sorting option rule ID
 * @param {dw.util.ArrayList.<dw.catalog.SortingOption>} sortingOptions - Sorting options
 * @param {dw.catalog.Category} rootCategory - Search result's root category
 */
function ProductSearch(productSearch, httpParams, sortingRule, sortingOptions, rootCategory) {
    // Pozovi parent constructor
    BaseProductSearch.call(this, productSearch, httpParams, sortingRule, sortingOptions, rootCategory);
    
    // Override permalink sa ispravnom logikom
    this.permalink = this.getFixedPermalink(productSearch, httpParams);
}

// Nasleđivanje prototype-a
ProductSearch.prototype = Object.create(BaseProductSearch.prototype);
ProductSearch.prototype.constructor = ProductSearch;

/**
 * Generiše permalink koristeći postojeću SFRA logiku
 */
ProductSearch.prototype.getFixedPermalink = function(productSearch, httpParams) {
    var PagingModel = require('dw/web/PagingModel');
    var startValue = httpParams.start ? parseInt(httpParams.start, 10) : 0;
    
    // Koristi PagingModel kao u originalnoj SFRA logici
    var paging = new PagingModel(
        productSearch.productSearchHits,
        productSearch.count
    );
    paging.setStart(startValue);
    paging.setPageSize(this.pageSize);
    
    // Koristi productSearch.url() koji automatski čuva sve parametre
    var baseUrl = productSearch.url('Search-Show');
    
    // appendPaging automatski dodaje start i sz parametre
    return paging.appendPaging(baseUrl).toString();
};

/**
 * Generiše podatke za paginaciju koristeći SFRA pristup
 */
ProductSearch.prototype.getPaginationData = function() {
    var PagingModel = require('dw/web/PagingModel');
    
    try {
        // Kreiraj PagingModel instancu
        var paging = new PagingModel(
            this.productSearch.productSearchHits,
            this.productSearch.count
        );
        
        // Koristi pageNumber koji već imamo
        var currentStart = 0;
        if (this.pageNumber && this.pageSize) {
            currentStart = (this.pageNumber - 1) * this.pageSize;
        }
        
        paging.setStart(currentStart);
        paging.setPageSize(this.pageSize);
        
        var currentPage = paging.currentPage;
        var maxPage = paging.maxPage;
        
        // Kalkuliši raspon stranica za prikaz (5 stranica)
        var startPage = Math.max(1, currentPage - 2);
        var endPage = Math.min(maxPage, startPage + 4);
        
        if (endPage - startPage < 4) {
            startPage = Math.max(1, endPage - 4);
        }
        
        // Generiši URL-ove za svaku stranicu
        var pageUrls = [];
        for (var i = startPage; i <= endPage; i++) {
            // Postavi start za ciljnu stranicu
            paging.setStart((i - 1) * this.pageSize);
            
            // Koristi istu logiku kao getShowMoreUrl
            var pageUrl = this.productSearch.url('Search-Show');
            pageUrl = paging.appendPaging(pageUrl);
            
            pageUrls.push({
                pageNum: i.toString(),
                url: pageUrl.toString(),
                isActive: (i === currentPage)
            });
        }
        
        // Reset na trenutnu stranicu za prev/next linkove
        paging.setStart(currentStart);
        
        // Previous URL
        var prevUrl = '';
        if (currentPage > 1) {
            paging.setStart((currentPage - 2) * this.pageSize);
            var prevBaseUrl = this.productSearch.url('Search-Show');
            prevUrl = paging.appendPaging(prevBaseUrl).toString();
        }
        
        // Next URL
        var nextUrl = '';
        if (currentPage < maxPage) {
            paging.setStart(currentPage * this.pageSize);
            var nextBaseUrl = this.productSearch.url('Search-Show');
            nextUrl = paging.appendPaging(nextBaseUrl).toString();
        }
        
        return {
            currentPage: currentPage,
            totalPages: maxPage,
            pageUrls: pageUrls,
            prevUrl: prevUrl,
            nextUrl: nextUrl,
            showPagination: this.count > this.pageSize
        };
    } catch (e) {
        // Fallback ako nešto pođe po zlu
        return {
            currentPage: 1,
            totalPages: 1,
            pageUrls: [],
            prevUrl: '',
            nextUrl: '',
            showPagination: false
        };
    }
};

module.exports = ProductSearch;