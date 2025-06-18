'use strict';

const baseSearch = require('app_storefront_base/search/search');

$(document).on('ajaxSuccess.searchUrlUpdate', function(event, xhr, settings) {
    console.log('AJAX Success detected:', settings.url);
    
    if (settings.url && (settings.url.indexOf('ShowAjax') > -1 || settings.url.indexOf('UpdateGrid') > -1)) {
        console.log('URL matches - looking for permalink...');
        
        const serverUrl = $(xhr.responseText).find('.permalink').val();
        console.log('Found permalink:', serverUrl);
        
        if (serverUrl) {
            console.log('Updating browser URL to:', serverUrl);
            window.history.replaceState({}, null, serverUrl);
        }
    }
});

const originalApplyFilter = baseSearch.applyFilter;

baseSearch.applyFilter = function() {
    originalApplyFilter.call(this);
};

module.exports = baseSearch;