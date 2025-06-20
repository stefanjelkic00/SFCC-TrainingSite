'use strict';

const baseHelpers = require('app_storefront_base/cartridge/scripts/helpers/searchHelpers');

function buildPaginationData(productSearch, httpParameterMap) {
    var URLUtils = require('dw/web/URLUtils');
    
    var startParam = httpParameterMap.start.value;
    var startValue = startParam ? parseInt(startParam, 10) : 0;
    var currentPage = Math.floor(startValue / productSearch.pageSize) + 1;
    var totalPages = Math.ceil(productSearch.count / productSearch.pageSize);
    var pageSize = productSearch.pageSize;
    
    var startPage = Math.max(1, currentPage - 2);
    var endPage = Math.min(totalPages, startPage + 4);
    
    if (endPage - startPage < 4) {
        startPage = Math.max(1, endPage - 4);
    }
    
    function buildUrl(pageNum) {
        var url = URLUtils.url('Search-Show');
        
        if (httpParameterMap.q && httpParameterMap.q.value) {
            url.append('q', httpParameterMap.q.value);
        }
        if (httpParameterMap.cgid && httpParameterMap.cgid.value) {
            url.append('cgid', httpParameterMap.cgid.value);
        }
        if (httpParameterMap.srule && httpParameterMap.srule.value) {
            url.append('srule', httpParameterMap.srule.value);
        }
        if (httpParameterMap.pmin && httpParameterMap.pmin.value) {
            url.append('pmin', httpParameterMap.pmin.value);
        }
        if (httpParameterMap.pmax && httpParameterMap.pmax.value) {
            url.append('pmax', httpParameterMap.pmax.value);
        }
        
        var prefIndex = 1;
        while (httpParameterMap['prefn' + prefIndex] && httpParameterMap['prefn' + prefIndex].value) {
            url.append('prefn' + prefIndex, httpParameterMap['prefn' + prefIndex].value);
            if (httpParameterMap['prefv' + prefIndex] && httpParameterMap['prefv' + prefIndex].value) {
                url.append('prefv' + prefIndex, httpParameterMap['prefv' + prefIndex].value);
            }
            prefIndex++;
        }
        
        url.append('start', (pageNum - 1) * pageSize);
        url.append('sz', pageSize);
        
        return url.toString();
    }
    
    var pageUrls = [];
    for (var i = startPage; i <= endPage; i++) {
        pageUrls.push({
            pageNum: Math.floor(i).toString(),
            url: buildUrl(i),
            isActive: (i == currentPage)
        });
    }
    
    var prevUrl = currentPage > 1 ? buildUrl(currentPage - 1) : '';
    var nextUrl = currentPage < totalPages ? buildUrl(currentPage + 1) : '';
    
    return {
        currentPage: currentPage,
        totalPages: totalPages,
        pageUrls: pageUrls,
        prevUrl: prevUrl,
        nextUrl: nextUrl,
        showPagination: productSearch.count > productSearch.pageSize
    };
}

module.exports = Object.assign({}, baseHelpers, {
    buildPaginationData: buildPaginationData
});