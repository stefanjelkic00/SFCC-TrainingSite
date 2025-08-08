'use strict';

const Template = require('dw/util/Template');
const HashMap = require('dw/util/HashMap');
const PageRenderHelper = require('*/cartridge/experience/utilities/PageRenderHelper.js');

module.exports.render = function (context, modelIn) {
    const model = modelIn || new HashMap();
    
    model.regions = PageRenderHelper.getRegionModelRegistry(context.component);
    
    model.regions.tiles.setClassName('row');
    model.regions.tiles.setComponentClassName('col-6 col-md-4 col-lg-3');
    
    return new Template('experience/components/commerce_assets/productTileHolder').render(model).text;
};