'use strict';

/**
 * Override Search controller to handle middleware resolution
 */

var server = require('server');

// Try to import middleware with fallbacks
var cache;
var consentTracking;
var pageMetaData;

try {
    cache = require('*/cartridge/scripts/middleware/cache');
    consentTracking = require('*/cartridge/scripts/middleware/consentTracking');
    pageMetaData = require('*/cartridge/scripts/middleware/pageMetaData');
} catch (e) {
    console.log('Using fallback middleware due to:', e);
    
    // Fallback middleware
    cache = {
        applyDefaultCache: function(req, res, next) { next(); },
        applyShortPromotionSensitiveCache: function(req, res, next) { next(); },
        applyPromotionSensitiveCache: function(req, res, next) { next(); },
        applyInventorySensitiveCache: function(req, res, next) { next(); }
    };
    
    consentTracking = {
        consent: function(req, res, next) { next(); }
    };
    
    pageMetaData = {
        computedPageMetaData: function(req, res, next) { next(); }
    };
}

// Get base controller
var baseSearch = module.superModule;

// Re-export all base functionality
module.exports = baseSearch;