'use strict';

const baseSearch = require('app_storefront_base/search/search');

$(document).on('ajaxSuccess.searchUrlUpdate', function(event, xhr, settings) {
    if (settings.url && (settings.url.indexOf('ShowAjax') > -1 || settings.url.indexOf('UpdateGrid') > -1)) {
        const serverUrl = $(xhr.responseText).find('.permalink').val();
        if (serverUrl) {
            window.history.replaceState({}, null, serverUrl);
        }
    }
});

const originalApplyFilter = baseSearch.applyFilter;

baseSearch.applyFilter = function() {
    originalApplyFilter.call(this);
};

module.exports = baseSearch;