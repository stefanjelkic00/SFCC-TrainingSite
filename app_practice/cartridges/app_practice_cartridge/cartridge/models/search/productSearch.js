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
    const totalCount = this.count || this.productSearch.count;
    const pageSize = this.pageSize || 24; 
    
    let paging = new PagingModel(this.productSearch.productSearchHits, totalCount);
    const currentStart = this.httpParams.start ? parseInt(this.httpParams.start, 10) : 0;
    
    paging.setStart(currentStart);
    paging.setPageSize(pageSize);
    
    const totalPages = Math.ceil(totalCount / pageSize);
    const currentPage = Math.floor(currentStart / pageSize) + 1;
    
    const windowSize = 5;
    const halfWindow = Math.floor(windowSize / 2);
    let startPage = totalPages <= windowSize ? 1 : Math.max(1, currentPage - halfWindow);
    let endPage = totalPages <= windowSize ? totalPages : Math.min(totalPages, currentPage + halfWindow);
    
    if (startPage === 1) {
        endPage = Math.min(totalPages, windowSize);
    } else if (endPage === totalPages) {
        startPage = Math.max(1, totalPages - windowSize + 1);
    }
    
    let pageUrls = [];
    for (let i = startPage; i <= endPage; i++) {
        let pageStart = (i - 1) * pageSize;
        let pagePaging = new PagingModel(this.productSearch.productSearchHits, totalCount);
        pagePaging.setStart(pageStart);
        pagePaging.setPageSize(pageSize);
        
        pageUrls.push({
            pageNum: i.toString(),
            url: pagePaging.appendPaging(this.productSearch.url('Search-Show')).toString(),
            isActive: (i === currentPage),
            start: pageStart
        });
    }
    
    let prevUrl = '';
    let prevPage = 0;
    if (currentPage > 1) {
        prevPage = currentPage - 1;
        let prevPaging = new PagingModel(this.productSearch.productSearchHits, totalCount);
        prevPaging.setStart((prevPage - 1) * pageSize);
        prevPaging.setPageSize(pageSize);
        prevUrl = prevPaging.appendPaging(this.productSearch.url('Search-Show')).toString();
    }
    
    let nextUrl = '';
    let nextPage = 0;
    if (currentPage < totalPages) {
        nextPage = currentPage + 1;
        let nextPaging = new PagingModel(this.productSearch.productSearchHits, totalCount);
        nextPaging.setStart((nextPage - 1) * pageSize);
        nextPaging.setPageSize(pageSize);
        nextUrl = nextPaging.appendPaging(this.productSearch.url('Search-Show')).toString();
    }
    
    return {
        currentPage: currentPage,
        totalPages: totalPages,
        pageUrls: pageUrls,
        prevUrl: prevUrl,
        nextUrl: nextUrl,
        prevPage: prevPage,
        nextPage: nextPage,
        showPagination: totalCount > pageSize,
        startPage: startPage,
        endPage: endPage,
        totalCount: totalCount,
        pageSize: pageSize,
        currentStart: currentStart
    };
};

module.exports = ProductSearch;