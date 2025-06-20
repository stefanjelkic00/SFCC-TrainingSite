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
    
    // Sačuvaj httpParams za kasnije korišćenje
    this.httpParams = httpParams;
}

// Nasleđivanje prototype-a
ProductSearch.prototype = Object.create(BaseProductSearch.prototype);
ProductSearch.prototype.constructor = ProductSearch;

/**
 * Generiše permalink koristeći postojeću SFRA logiku
 */
ProductSearch.prototype.getFixedPermalink = function(productSearch, httpParams) {
    try {
        var PagingModel = require('dw/web/PagingModel');
        var startValue = httpParams.start ? parseInt(httpParams.start, 10) : 0;
        
        var paging = new PagingModel(
            productSearch.productSearchHits,
            productSearch.count
        );
        paging.setStart(startValue);
        paging.setPageSize(this.pageSize);
        
        var baseUrl = productSearch.url('Search-Show');
        return paging.appendPaging(baseUrl).toString();
    } catch (e) {
        return productSearch.url('Search-Show').toString();
    }
};

/**
 * Generiše podatke za paginaciju sa sliding window logikom
 */
ProductSearch.prototype.getPaginationData = function() {
    var PagingModel = require('dw/web/PagingModel');
    
    try {
        // Kreiraj PagingModel sa trenutnim podacima
        var paging = new PagingModel(
            this.productSearch.productSearchHits,
            this.productSearch.count
        );
        
        // Dobij start parametar iz httpParams
        var currentStart = this.httpParams.start ? parseInt(this.httpParams.start, 10) : 0;
        
        paging.setStart(currentStart);
        paging.setPageSize(this.pageSize);
        
        // VAŽNO: PagingModel vraća currentPage koji počinje od 0, ali mi želimo da počne od 1
        var currentPage = paging.currentPage + 1;
        var maxPage = paging.maxPage;
        
        // Debug logovanje
        var Logger = require('dw/system/Logger');
        Logger.info('Pagination Debug - Start: {0}, PageSize: {1}, CurrentPage (0-based): {2}, CurrentPage (1-based): {3}, MaxPage: {4}', 
            currentStart, this.pageSize, paging.currentPage, currentPage, maxPage);
        
        // Sliding window logika
        var windowSize = 5;
        var halfWindow = Math.floor(windowSize / 2);
        var startPage, endPage;
        
        if (maxPage <= windowSize) {
            // Ako ima manje stranica od window size, prikaži sve
            startPage = 1;
            endPage = maxPage;
        } else {
            // Centriraj trenutnu stranicu
            startPage = Math.max(1, currentPage - halfWindow);
            endPage = Math.min(maxPage, currentPage + halfWindow);
            
            // Prilagodi ako smo blizu početka
            if (startPage === 1) {
                endPage = Math.min(maxPage, windowSize);
            }
            // Prilagodi ako smo blizu kraja
            else if (endPage === maxPage) {
                startPage = Math.max(1, maxPage - windowSize + 1);
            }
        }
        
        // Generiši URL-ove za svaku stranicu
        var pageUrls = [];
        for (var i = startPage; i <= endPage; i++) {
            var pageStart = (i - 1) * this.pageSize;
            
            // Kreiraj novi PagingModel za svaku stranicu
            var pagePaging = new PagingModel(
                this.productSearch.productSearchHits,
                this.productSearch.count
            );
            pagePaging.setStart(pageStart);
            pagePaging.setPageSize(this.pageSize);
            
            var pageUrl = this.productSearch.url('Search-Show');
            pageUrl = pagePaging.appendPaging(pageUrl);
            
            pageUrls.push({
                pageNum: i.toString(),
                url: pageUrl.toString(),
                isActive: (i === currentPage),
                start: pageStart
            });
        }
        
        // Previous URL - moramo paziti da prevPage bude u 1-based sistemu
        var prevUrl = '';
        var prevPage = 0;
        if (currentPage > 1) {
            prevPage = currentPage - 1;
            var prevStart = (prevPage - 1) * this.pageSize;
            
            var prevPaging = new PagingModel(
                this.productSearch.productSearchHits,
                this.productSearch.count
            );
            prevPaging.setStart(prevStart);
            prevPaging.setPageSize(this.pageSize);
            
            var prevBaseUrl = this.productSearch.url('Search-Show');
            prevUrl = prevPaging.appendPaging(prevBaseUrl).toString();
        }
        
        // Next URL - moramo paziti da nextPage bude u 1-based sistemu
        var nextUrl = '';
        var nextPage = 0;
        if (currentPage < maxPage) {
            nextPage = currentPage + 1;
            var nextStart = (nextPage - 1) * this.pageSize;
            
            var nextPaging = new PagingModel(
                this.productSearch.productSearchHits,
                this.productSearch.count
            );
            nextPaging.setStart(nextStart);
            nextPaging.setPageSize(this.pageSize);
            
            var nextBaseUrl = this.productSearch.url('Search-Show');
            nextUrl = nextPaging.appendPaging(nextBaseUrl).toString();
        }
        
        return {
            currentPage: currentPage,
            totalPages: maxPage,
            pageUrls: pageUrls,
            prevUrl: prevUrl,
            nextUrl: nextUrl,
            prevPage: prevPage,
            nextPage: nextPage,
            showPagination: this.count > this.pageSize,
            startPage: startPage,
            endPage: endPage
        };
    } catch (e) {
        // Fallback za greške
        return {
            currentPage: 1,
            totalPages: 1,
            pageUrls: [{
                pageNum: '1',
                url: this.productSearch.url('Search-Show').toString(),
                isActive: true,
                start: 0
            }],
            prevUrl: '',
            nextUrl: '',
            prevPage: 0,
            nextPage: 0,
            showPagination: false,
            startPage: 1,
            endPage: 1
        };
    }
};

module.exports = ProductSearch;