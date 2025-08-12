'use strict';

const server = require('server');
const searchHelpers = require('*/cartridge/scripts/helpers/searchHelpers');

server.extend(module.superModule);

server.append('Refinebar', function (req, res, next) {
    if (req.querystring.sz && res.viewData.productSearch) {
        searchHelpers.addPageSizeToRefinements(res.viewData.productSearch, req.querystring.sz);
    }
    
    next();
});

server.append('Show', function (req, res, next) {
    const blogHelpers = require('*/cartridge/scripts/helpers/blogHelpers');
    
    const searchTerm = req.querystring.q;
    
    if (searchTerm) {
        const blogResults = blogHelpers.searchBlogs(searchTerm, 20);
        
        const blogs = [];
        for (let i = 0; i < blogResults.length; i++) {
            blogs.push(blogHelpers.formatBlogForSearch(blogResults[i]));
        }
        
        res.setViewData({
            blogSearchResults: blogs,
            blogCount: blogs.length
        });
    }
    
    next();
});

server.get('BlogContent', function (req, res, next) {
    const blogHelpers = require('*/cartridge/scripts/helpers/blogHelpers');
    const searchTerm = req.querystring.q;
    const startingPage = parseInt(req.querystring.startingPage) || 0;
    const pageSize = 12;
    const results = blogHelpers.getBlogSearchResultsChunk(searchTerm, startingPage, pageSize);
    
    res.render('search/blogGrid', results);
    
    next();
});

module.exports = server.exports();