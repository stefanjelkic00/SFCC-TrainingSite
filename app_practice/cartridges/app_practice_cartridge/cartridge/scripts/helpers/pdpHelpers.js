'use strict';

const ProductMgr = require('dw/catalog/ProductMgr');
const ContentMgr = require('dw/content/ContentMgr');

function getRandomProductWithStock(slotContent) {
    if (!slotContent || !slotContent.length) {
        return null;
    }
    let productsWithStock = [];
    
    for (let i = 0; i < slotContent.length; i++) {
        let product = slotContent[i];
        
        if (product) {
            let availabilityModel = product.getAvailabilityModel();
            if (availabilityModel && availabilityModel.inStock) {
                productsWithStock.push(product);
            }
        }
    }
    
    if (productsWithStock.length === 0) {
        return null;
    }
    
    let randomIndex = Math.floor(Math.random() * productsWithStock.length);
    return productsWithStock[randomIndex];
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
        hasRecommendations: false
    };
    
    if (!slotcontent || !slotcontent.content || !slotcontent.content.length) {
        return result; 
    }
    
    let productsToCheck = slotcontent.content.length;
    let checkedProducts = 0;
    
    while (checkedProducts < productsToCheck) {
        let productWithStock = getRandomProductWithStock(slotcontent.content);
        
        if (productWithStock) {
            let recommendations = getAvailableRecommendations(productWithStock);
            
            if (recommendations.length > 0) {
                result.recommendations = recommendations;
                result.hasRecommendations = true;
                return result;
            }
        }
        
        checkedProducts++;
    }
    
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