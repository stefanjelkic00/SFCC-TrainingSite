'use strict';

const ContentMgr = require('dw/content/ContentMgr');
const collections = require('*/cartridge/scripts/util/collections');

function getSlotRecommendations(products) {
    const validProducts = [];
    for (let i = 0; i < products.length; i++) {
        let product = products[i];
        if (product.online && 
            product.availabilityModel.isOrderable() &&
            product.getOrderableRecommendations() &&
            !product.getOrderableRecommendations().empty) {
            validProducts.push(product);
        }
    }
    
    const randomIndex = Math.floor(Math.random() * validProducts.length);
    const selectedProduct = validProducts[randomIndex];

    const recommendations = collections.map(
        selectedProduct.getOrderableRecommendations(),
        function(rec) { 
            return rec.getRecommendedItem(); 
        }
    ).filter(function(item) { 
        return item != null; 
    });
    
    return recommendations;
}

function getRandomProductForPromo(products) {
    const availableProducts = collections.map(products, function(product) {
        return product;
    }).filter(function(product) {
        return product.online && product.availabilityModel.isOrderable();
    });
    
    if (availableProducts.length > 0) {
        const randomIndex = Math.floor(Math.random() * availableProducts.length);
        return availableProducts[randomIndex];
    }
    
    return null;
}

function renderContentAsset(assetId) {
    const content = assetId && ContentMgr.getContent(assetId);
    return (content && content.custom && content.custom.body);
}

module.exports = {
    getSlotRecommendations: getSlotRecommendations,
    getRandomProductForPromo: getRandomProductForPromo,
    renderContentAsset: renderContentAsset
};