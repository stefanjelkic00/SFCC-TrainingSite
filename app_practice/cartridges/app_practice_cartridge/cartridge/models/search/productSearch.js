'use strict';

const BaseProductSearch = require('app_storefront_base/cartridge/models/search/productSearch');
const PagingModel = require('dw/web/PagingModel');

function ProductSearch(productSearch, httpParams, sortingRule, sortingOptions, rootCategory) {
    BaseProductSearch.call(this, productSearch, httpParams, sortingRule, sortingOptions, rootCategory);
    this.permalink = this.getFixedPermalink(productSearch, httpParams);
    this.httpParams = httpParams;
}

ProductSearch.prototype = Object.create(BaseProductSearch.prototype);
ProductSearch.prototype.constructor = ProductSearch;

ProductSearch.prototype.getFixedPermalink = function(productSearch, httpParams) {
    
        const startValue = httpParams.start ? parseInt(httpParams.start, 10) : 0;
        
        const paging = new PagingModel(productSearch.productSearchHits, productSearch.count);
        paging.setStart(startValue);
        paging.setPageSize(this.pageSize);
        
        return paging.appendPaging(productSearch.url('Search-Show')).toString();
   
};

ProductSearch.prototype.getPaginationData = function() {
    
        let paging = new PagingModel(this.productSearch.productSearchHits, this.productSearch.count);
        const currentStart = this.httpParams.start ? parseInt(this.httpParams.start, 10) : 0;
        
        paging.setStart(currentStart);
        paging.setPageSize(this.pageSize);
        
        let currentPage = paging.currentPage + 1;
        let maxPage = paging.maxPage;
        
        const  windowSize = 5;
        const  halfWindow = Math.floor(windowSize / 2);
        let startPage = maxPage <= windowSize ? 1 : Math.max(1, currentPage - halfWindow);
        let endPage = maxPage <= windowSize ? maxPage : Math.min(maxPage, currentPage + halfWindow);
        
        if (startPage === 1) {
            endPage = Math.min(maxPage, windowSize);
        } else if (endPage === maxPage) {
            startPage = Math.max(1, maxPage - windowSize + 1);
        }
        
        let pageUrls = [];
        for (let i = startPage; i <= endPage; i++) {
            let pageStart = (i - 1) * this.pageSize;
            let pagePaging = new PagingModel(this.productSearch.productSearchHits, this.productSearch.count);
            pagePaging.setStart(pageStart);
            pagePaging.setPageSize(this.pageSize);
            
            pageUrls.push({
                pageNum: i.toString(),
                url: pagePaging.appendPaging(this.productSearch.url('Search-Show')).toString(),
                isActive: (i === currentPage),
                start: pageStart
            });
        }
        
        let prevUrl = '';
        let nextUrl = '';
        
        if (currentPage > 1) {
            let prevPaging = new PagingModel(this.productSearch.productSearchHits, this.productSearch.count);
            prevPaging.setStart((currentPage - 2) * this.pageSize);
            prevPaging.setPageSize(this.pageSize);
            prevUrl = prevPaging.appendPaging(this.productSearch.url('Search-Show')).toString();
        }
        
        if (currentPage < maxPage) {
            let nextPaging = new PagingModel(this.productSearch.productSearchHits, this.productSearch.count);
            nextPaging.setStart(currentPage * this.pageSize);
            nextPaging.setPageSize(this.pageSize);
            nextUrl = nextPaging.appendPaging(this.productSearch.url('Search-Show')).toString();
        }
        
        return {
            currentPage: currentPage,
            totalPages: maxPage,
            pageUrls: pageUrls,
            prevUrl: prevUrl,
            nextUrl: nextUrl,
            showPagination: this.count > this.pageSize,
            startPage: startPage,
            endPage: endPage
        };
  
};

module.exports = ProductSearch;