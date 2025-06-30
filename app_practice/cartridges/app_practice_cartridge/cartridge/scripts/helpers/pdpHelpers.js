'use strict';

const ProductMgr = require('dw/catalog/ProductMgr');
const ContentMgr = require('dw/content/ContentMgr');

function getRandomProductWithStock(slotContent, maxAttempts) {
    maxAttempts = maxAttempts || 5;
    
    if (!slotContent || !slotContent.length) {
        return null;
    }
    
    for (let i = 0; i < maxAttempts; i++) {
        let randomIndex = Math.floor(Math.random() * slotContent.length);
        let slotProduct = slotContent[randomIndex];
        let productId = slotProduct.ID || slotProduct;
        let product = ProductMgr.getProduct(productId);
        
        if (product) {
            let availabilityModel = product.getAvailabilityModel();
            if (availabilityModel && availabilityModel.inStock) {
                return product;
            }
        }
    }
    
    return null;
}


function getAvailableRecommendations(product) {
    if (!product) {
        return [];
    }
    
    let recommendations = [];
    let productRecommendations = product.getRecommendations();
    
    if (!productRecommendations) {
        return recommendations;
    }
    
    let iter = productRecommendations.iterator();
    
    while (iter.hasNext()) {
        let recommendation = iter.next();
        let recProduct = recommendation.getRecommendedItem();
        
        if (recProduct) {
            let recAvailability = recProduct.getAvailabilityModel();
            let isOnline = recProduct.isOnline();
            let recHasStock = recAvailability && recAvailability.inStock;
            
            if (isOnline && recHasStock) {
                recommendations.push(recProduct);
            }
        }
    }
    
    return recommendations;
}


function getSlotRecommendations(slotcontent) {
    let result = {
        recommendations: [],
        statusMessage: '',
        hasRecommendations: false
    };
    
    if (!slotcontent || !slotcontent.content || !slotcontent.content.length) {
        result.statusMessage = 'Slot is empty.';
        return result;
    }
    
    let productWithStock = getRandomProductWithStock(slotcontent.content);
    
    if (!productWithStock) {
        result.statusMessage = 'No products from the slot have available stock.';
        return result;
    }
    
    let recommendations = getAvailableRecommendations(productWithStock);
    
    if (recommendations.length === 0) {
        result.statusMessage = 'There are no recommendations for this product.';
        return result;
    }
    
    result.recommendations = recommendations;
    result.hasRecommendations = true;
    
    return result;
}


function renderContentAsset(assetId) {
    const content = assetId && ContentMgr.getContent(assetId);
    return (content && content.custom && content.custom.body) || '';
}

module.exports = {
    getRandomProductWithStock: getRandomProductWithStock,
    getAvailableRecommendations: getAvailableRecommendations,
    getSlotRecommendations: getSlotRecommendations,
    renderContentAsset: renderContentAsset
};