'use strict';

const Template = require('dw/util/Template');
const HashMap = require('dw/util/HashMap');
const ProductMgr = require('dw/catalog/ProductMgr');

module.exports.render = function (context, modelIn) {
    const model = modelIn || new HashMap();
    const content = context.content;
    
    if (content.product) {
        const apiProduct = ProductMgr.getProduct(content.product.ID);
        
        if (apiProduct && apiProduct.online && apiProduct.availabilityModel.inStock) {
            model.product = {
                id: apiProduct.ID,
                name: apiProduct.name,
                price: apiProduct.priceModel.price,
                imageURL: apiProduct.getImage('medium').getURL(),
                inStock: true,
                online: true
            };
            model.showProduct = true;
        } else {
            model.showProduct = false;
        }
    }
    
    return new Template('experience/components/commerce_assets/productTileCustom').render(model).text;
};