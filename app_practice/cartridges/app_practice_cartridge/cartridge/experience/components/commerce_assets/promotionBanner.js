'use strict';

const Template = require('dw/util/Template');
const HashMap = require('dw/util/HashMap');
const URLUtils = require('dw/web/URLUtils');
const ImageTransformation = require('*/cartridge/experience/utilities/ImageTransformation.js');

module.exports.render = function (context, modelIn) {
    const model = modelIn || new HashMap();
    const content = context.content;

    if (content.image) {
        model.image = ImageTransformation.getScaledImage(content.image);
    }
    
    model.alt = content.alt || '';
    model.linkText = content.linkText || '';
    
    if (content.product) {
        model.productUrl = URLUtils.url('Product-Show', 'pid', content.product.ID).toString();
    }
    
    const expires = new Date();
    expires.setDate(expires.getDate() + 1);
    response.setExpires(expires);

    return new Template('experience/components/commerce_assets/promotionBanner').render(model).text;
};