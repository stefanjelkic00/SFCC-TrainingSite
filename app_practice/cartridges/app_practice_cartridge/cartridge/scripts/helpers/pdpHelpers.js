'use strict';

const ContentMgr = require('dw/content/ContentMgr');
const collections = require('*/cartridge/scripts/util/collections');
const Money = require('dw/value/Money');

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
    let availableProducts = [];
    
    for (let i = 0; i < products.length; i++) {
        let product = products[i];
        if (product.online && product.availabilityModel.isOrderable()) {
            availableProducts.push(product);
        }
    }
    
    if (availableProducts.length > 0) {
        let randomIndex = Math.floor(Math.random() * availableProducts.length);
        let selectedProduct = availableProducts[randomIndex];
        let originalPrice = selectedProduct.priceModel.price;
        let promoPrice = new Money(originalPrice.value * 0.5, originalPrice.currencyCode);
        
        return {
            product: selectedProduct,
            originalPrice: originalPrice,
            promoPrice: promoPrice
        };
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