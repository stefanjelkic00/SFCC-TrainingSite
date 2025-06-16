'use strict';

var BaseAttributeValue = require('*/cartridge/models/search/attributeRefinementValue/base');

/**
 * @constructor
 * @classdesc Color attribute refinement value model
 *
 * @param {dw.catalog.ProductSearchModel} productSearch - ProductSearchModel instance
 * @param {dw.catalog.ProductSearchRefinementDefinition} refinementDefinition - Refinement
 *     definition
 * @param {dw.catalog.ProductSearchRefinementValue} refinementValue - Raw DW refinement value
 */
function ColorAttributeValue(productSearch, refinementDefinition, refinementValue) {
    var Logger = require('dw/system/Logger');
    var logger = Logger.getLogger('color-working-debug', 'color');
    
    try {
        logger.info('=== COLOR CONSTRUCTOR START ===');
        logger.info('ProductSearch exists: {0}', !!productSearch);
        logger.info('RefinementDefinition attributeID: {0}', refinementDefinition.attributeID);
        logger.info('RefinementValue value: {0}', refinementValue.value);
        
        this.productSearch = productSearch;
        this.refinementDefinition = refinementDefinition;
        this.refinementValue = refinementValue;

        logger.info('About to call initialize()');
        this.initialize();
        logger.info('Initialize() completed successfully');
        logger.info('=== COLOR CONSTRUCTOR END ===');
        
    } catch (e) {
        logger.error('COLOR CONSTRUCTOR ERROR: {0}', e.message);
        logger.error('Stack: {0}', e.stack);
        throw e;
    }
}

ColorAttributeValue.prototype = Object.create(BaseAttributeValue.prototype);

ColorAttributeValue.prototype.initialize = function () {
    var Logger = require('dw/system/Logger');
    var logger = Logger.getLogger('color-working-debug', 'color');
    
    try {
        logger.info('=== INITIALIZE START ===');
        
        // Pozovi parent initialize
        logger.info('Calling BaseAttributeValue.initialize()');
        BaseAttributeValue.prototype.initialize.call(this);
        logger.info('BaseAttributeValue.initialize() completed');
        logger.info('actionEndpoint after parent init: {0}', this.actionEndpoint);
        logger.info('seoRefineEndpoint after parent init: {0}', this.seoRefineEndpoint);
        
        this.type = 'color';
        logger.info('Set type to: {0}', this.type);
        
        this.displayValue = this.getDisplayValue(this.refinementValue);
        logger.info('DisplayValue: {0}', this.displayValue);
        
        this.swatchId = 'swatch-circle-' + this.presentationId;
        logger.info('SwatchId: {0}', this.swatchId);
        logger.info('PresentationId used: {0}', this.presentationId);
        
        this.selected = this.isSelected(
            this.productSearch,
            this.refinementDefinition.attributeID,
            this.refinementValue.value
        );
        logger.info('Selected: {0}', this.selected);
        
        logger.info('About to generate regular URL with actionEndpoint: {0}', this.actionEndpoint);
        this.url = this.getUrl(
            this.productSearch,
            this.actionEndpoint,
            this.id,
            this.value,
            this.selected,
            this.selectable
        );
        logger.info('Regular URL generated: {0}', this.url);
        
        logger.info('About to generate SEO URL with seoRefineEndpoint: {0}', this.seoRefineEndpoint);
        this.seoRefineUrl = this.getUrl(
            this.productSearch,
            this.seoRefineEndpoint,
            this.id,
            this.value,
            this.selected,
            this.selectable
        );
        logger.info('SEO URL generated: {0}', this.seoRefineUrl);
        
        this.title = this.getTitle(
            this.selected,
            this.selectable,
            this.refinementDefinition.displayName,
            this.displayValue
        );
        logger.info('Title: {0}', this.title);
        
        logger.info('=== INITIALIZE END ===');
        
        // Finalni pregled svih vrednosti
        logger.info('=== FINAL VALUES SUMMARY ===');
        logger.info('id: {0}', this.id);
        logger.info('value: {0}', this.value);
        logger.info('url: {0}', this.url);
        logger.info('seoRefineUrl: {0}', this.seoRefineUrl);
        logger.info('actionEndpoint: {0}', this.actionEndpoint);
        logger.info('seoRefineEndpoint: {0}', this.seoRefineEndpoint);
        logger.info('=== END SUMMARY ===');
        
    } catch (e) {
        logger.error('INITIALIZE ERROR: {0}', e.message);
        logger.error('Stack: {0}', e.stack);
        logger.error('this.actionEndpoint at error: {0}', this.actionEndpoint);
        logger.error('this.seoRefineEndpoint at error: {0}', this.seoRefineEndpoint);
        throw e;
    }
};

/**
 * @constructor
 * @classdesc Color attribute refinement value model
 *
 * @param {dw.catalog.ProductSearchModel} productSearch - ProductSearchModel instance
 * @param {dw.catalog.ProductSearchRefinementDefinition} refinementDefinition - Refinement
 *     definition
 * @param {dw.catalog.ProductSearchRefinementValue} refinementValue - Raw DW refinement value
 */
function ColorRefinementValueWrapper(productSearch, refinementDefinition, refinementValue) {
    var Logger = require('dw/system/Logger');
    var logger = Logger.getLogger('color-working-debug', 'color');
    
    try {
        logger.info('=== WRAPPER START ===');
        
        var value = new ColorAttributeValue(
            productSearch,
            refinementDefinition,
            refinementValue
        );
        logger.info('ColorAttributeValue instance created');
        
        var items = [
            'id',
            'type',
            'displayValue',
            'presentationId',
            'selected',
            'selectable',
            'swatchId',
            'title',
            'url',
            'seoRefineUrl'
        ];
        
        logger.info('Copying {0} properties to wrapper', items.length);
        items.forEach(function (item) {
            this[item] = value[item];
            logger.info('Copied {0}: {1}', item, value[item]);
        }, this);
        
        logger.info('=== WRAPPER COMPLETE ===');
        logger.info('Final wrapper seoRefineUrl: {0}', this.seoRefineUrl);
        
    } catch (e) {
        logger.error('WRAPPER ERROR: {0}', e.message);
        logger.error('Stack: {0}', e.stack);
        throw e;
    }
}

module.exports = ColorRefinementValueWrapper;