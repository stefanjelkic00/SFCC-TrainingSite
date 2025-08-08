'use strict';

const Template = require('dw/util/Template');
const HashMap = require('dw/util/HashMap');
const PageRenderHelper = require('*/cartridge/experience/utilities/PageRenderHelper.js');

module.exports.render = function (context, modelIn) {
    const model = modelIn || new HashMap();
    
    model.page = context.page;
    model.regions = PageRenderHelper.getRegionModelRegistry(context.page);

    const isEditMode = PageRenderHelper.isInEditMode ? PageRenderHelper.isInEditMode() : false;
    model.hideHeaderFooter = !isEditMode;
    
    return new Template('experience/pages/componentWrapper').render(model).text;
};