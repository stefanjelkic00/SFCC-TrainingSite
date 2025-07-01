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
        
        if (product && product.online && product.availabilityModel.isOrderable()) {
            let recs = product.getOrderableRecommendations();
            if (recs && !recs.empty) {
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
    let recommendations = [];
    let orderableRecs = product.getOrderableRecommendations();
    
    if (orderableRecs && !orderableRecs.empty) {
        let iter = orderableRecs.iterator();
        while (iter.hasNext()) {
            let rec = iter.next();
            let recProduct = rec.getRecommendedItem();
            if (recProduct) {
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

    let uncheckedIndices = [];
    for (let i = 0; i < slotcontent.content.length; i++) {
        uncheckedIndices.push(i);
    }
    
    while (uncheckedIndices.length > 0) {
        let randomPosition = Math.floor(Math.random() * uncheckedIndices.length);
        let productIndex = uncheckedIndices[randomPosition];
        let product = slotcontent.content[productIndex];
        
        if (product && product.online && product.availabilityModel.isOrderable()) {
            let orderableRecs = product.getOrderableRecommendations();
            
            if (orderableRecs && !orderableRecs.empty) {
                result.recommendations = orderableRecs.toArray().map(function(rec) {
                    return rec.getRecommendedItem();
                }).filter(Boolean);
                
                result.hasRecommendations = true;
                return result;
            }
        }
        
        uncheckedIndices[randomPosition] = uncheckedIndices[uncheckedIndices.length - 1];
        uncheckedIndices.length = uncheckedIndices.length - 1;
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