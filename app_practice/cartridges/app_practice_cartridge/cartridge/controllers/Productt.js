'use strict';

var server = require('server');
var page = module.superModule;
server.extend(page);

/**
 * Append logiku za Task 13 - Random product recommendations
 */
server.append('Show', function (req, res, next) {
    var Logger = require('dw/system/Logger');
    var logger = Logger.getLogger('task13', 'task13');
    
    logger.error('=== TASK 13 START ===');
    
    var ProductMgr = require('dw/catalog/ProductMgr');
    var ContentMgr = require('dw/content/ContentMgr');
    var ArrayList = require('dw/util/ArrayList');
    var RenderingTemplate = require('dw/util/RenderingTemplate');
    var HashMap = require('dw/util/HashMap');
    
    var viewData = res.getViewData();
    
    try {
        // Dobavi content iz slota koristeći ContentMgr
        var slotContent = ContentMgr.getContent('pdp-product-recommendations-campaign');
        var products = new ArrayList();
        
        if (slotContent && slotContent.online) {
            logger.error('Slot content found');
            
            // Alternativa: koristi rendering template da dobiješ proizvode
            var slotRenderingTemplate = new RenderingTemplate();
            slotRenderingTemplate.setContent(slotContent);
            
            // Pokušaj da dobiješ custom attributes
            if (slotContent.custom) {
                logger.error('Slot has custom attributes');
                
                // Iteriraj kroz custom atribute da nađeš proizvode
                Object.keys(slotContent.custom).forEach(function(key) {
                    logger.error('Custom attribute: ' + key + ' = ' + slotContent.custom[key]);
                    
                    // Proveri da li je ovo lista proizvoda
                    if (key.indexOf('product') !== -1 && slotContent.custom[key]) {
                        var productIds = slotContent.custom[key].toString().split(',');
                        productIds.forEach(function(pid) {
                            pid = pid.trim();
                            if (pid) {
                                var product = ProductMgr.getProduct(pid);
                                if (product && product.online && product.availabilityModel.inStock) {
                                    products.add(product);
                                    logger.error('Added product: ' + pid);
                                }
                            }
                        });
                    }
                });
            }
        }
        
        // Ako nema proizvoda iz slota, pokušaj da dobiješ iz promocija
        if (products.empty) {
            logger.error('No products from slot, checking promotions');
            
            var PromotionMgr = require('dw/campaign/PromotionMgr');
            var promotions = PromotionMgr.getActivePromotions();
            
            promotions.toArray().forEach(function(promo) {
                if (promo.getPromotionalProducts && products.size() < 10) {
                    var promoProducts = promo.getPromotionalProducts();
                    if (promoProducts) {
                        promoProducts.toArray().forEach(function(prod) {
                            if (prod && prod.online && prod.availabilityModel.inStock) {
                                products.add(prod);
                            }
                        });
                    }
                }
            });
        }
        
        logger.error('Total products found: ' + products.size());
        
        if (!products.empty) {
            // Random selekcija
            var randomIndex = Math.floor(Math.random() * products.size());
            var randomProduct = products.get(randomIndex);
            
            // Preporuke
            var recommendations = new ArrayList();
            
            // Prvo pokušaj recommendation API
            if (randomProduct.getRecommendations) {
                var crossSell = randomProduct.getRecommendations(1);
                if (crossSell && crossSell.size() > 0) {
                    crossSell.toArray().forEach(function(rec) {
                        if (rec.online && rec.availabilityModel.inStock && recommendations.size() < 4) {
                            recommendations.add(rec);
                        }
                    });
                }
            }
            
            // Dopuni sa drugim proizvodima iz liste
            if (recommendations.size() < 4) {
                products.toArray().forEach(function(prod) {
                    if (prod.ID !== randomProduct.ID && recommendations.size() < 4) {
                        recommendations.add(prod);
                    }
                });
            }
            
            viewData.randomProductRecommendations = {
                randomProduct: randomProduct,
                recommendations: recommendations,
                isRegistered: req.currentCustomer.raw.registered
            };
            
            logger.error('Set recommendations: ' + recommendations.size());
        }
        
    } catch (e) {
        logger.error('Error in Task 13: ' + e.message);
        logger.error('Stack: ' + e.stack);
    }
    
    logger.error('=== TASK 13 END ===');
    
    res.setViewData(viewData);
    next();
});

module.exports = server.exports();