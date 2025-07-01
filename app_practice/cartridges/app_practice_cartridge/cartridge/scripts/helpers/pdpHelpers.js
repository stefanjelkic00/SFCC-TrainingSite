'use strict';

const ContentMgr = require('dw/content/ContentMgr');
const collections = require('*/cartridge/scripts/util/collections');

function getSlotRecommendations(slotcontent) {
    const startIndex = Math.floor(Math.random() * slotcontent.content.length);
    
    for (let i = 0; i < slotcontent.content.length; i++) {
        let index = (startIndex + i) % slotcontent.content.length;
        
        if (slotcontent.content[index].online && 
            slotcontent.content[index].availabilityModel.isOrderable() &&
            slotcontent.content[index].getOrderableRecommendations() &&
            !slotcontent.content[index].getOrderableRecommendations().empty) {
            
            let recommendations = collections.map(
                slotcontent.content[index].getOrderableRecommendations(),
                function(rec) { return rec.getRecommendedItem(); }
            ).filter(function(item) { 
                return item != null; 
            });
            
            if (recommendations.length > 0) {
                return { recommendations: recommendations };
            }
        }
    }
    
    return { recommendations: [] };
}

function renderContentAsset(assetId) {
    const content = assetId && ContentMgr.getContent(assetId);
    return (content && content.custom && content.custom.body);
}

module.exports = {
    getSlotRecommendations: getSlotRecommendations,
    renderContentAsset: renderContentAsset
};