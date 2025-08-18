'use strict';

const server = require('server');
server.extend(module.superModule);

server.replace('GetSuggestions', function (req, res, next) {
    const SuggestModel = require('dw/suggest/SuggestModel');
    const CategorySuggestions = require('*/cartridge/models/search/suggestions/category');
    const ContentSuggestions = require('*/cartridge/models/search/suggestions/content');
    const ProductSuggestions = require('*/cartridge/models/search/suggestions/product');
    const SearchPhraseSuggestions = require('*/cartridge/models/search/suggestions/searchPhrase');
    const BlogSuggestions = require('*/cartridge/models/search/suggestions/blog');
    const Resource = require('dw/web/Resource');
    
    const searchTerms = req.querystring.q;
    const minChars = 2;
    const maxSuggestions = 3;

    if (searchTerms && searchTerms.length >= minChars) {
        const suggestions = new SuggestModel();
        suggestions.setFilteredByFolder(false);
        suggestions.setSearchPhrase(searchTerms);
        suggestions.setMaxSuggestions(maxSuggestions);
        
        const categorySuggestions = new CategorySuggestions(suggestions, maxSuggestions);
        const contentSuggestions = new ContentSuggestions(suggestions, maxSuggestions);
        const productSuggestions = new ProductSuggestions(suggestions, maxSuggestions);
        const recentSuggestions = new SearchPhraseSuggestions(suggestions.recentSearchPhrases, maxSuggestions);
        const popularSuggestions = new SearchPhraseSuggestions(suggestions.popularSearchPhrases, maxSuggestions);
        const brandSuggestions = new SearchPhraseSuggestions(suggestions.brandSuggestions, maxSuggestions);
        const blogSuggestions = new BlogSuggestions(searchTerms, maxSuggestions);

        if (productSuggestions.available || contentSuggestions.available
            || categorySuggestions.available
            || recentSuggestions.available
            || popularSuggestions.available
            || brandSuggestions.available
            || blogSuggestions.available) {
                
            const total = productSuggestions.products.length + contentSuggestions.contents.length
                + categorySuggestions.categories.length
                + recentSuggestions.phrases.length
                + popularSuggestions.phrases.length
                + brandSuggestions.phrases.length
                + blogSuggestions.blogs.length;
                
            res.render('search/suggestions', {
                suggestions: {
                    product: productSuggestions,
                    category: categorySuggestions,
                    content: contentSuggestions,
                    recent: recentSuggestions,
                    popular: popularSuggestions,
                    brand: brandSuggestions,
                    blog: blogSuggestions,
                    message: Resource.msgf('label.header.search.result.count.msg', 'common', null, [String(total)])
                }
            });
        } else {
            res.json({});
        }
    } else {
        res.json({});
    }

    next();
});

module.exports = server.exports();