'use strict';

const URLUtils = require('dw/web/URLUtils');

function BlogSuggestions(searchTerm, maxItems) {
    const blogHelpers = require('*/cartridge/scripts/helpers/blogHelpers');
    
    this.blogs = [];
    this.available = false;
    
    if (!searchTerm || searchTerm.length < 2) {
        return;
    }
    
    const searchResults = blogHelpers.searchBlogs(searchTerm, maxItems);
    
    if (searchResults && searchResults.length > 0) {
        this.available = true;
        
        const resultsCount = Math.min(searchResults.length, maxItems);
        
        for (let i = 0; i < resultsCount; i++) {
            const blog = searchResults[i];
            const blogItem = {
                title: blog.custom.title || '',
                excerpt: blog.custom.content ? 
                    blog.custom.content.substring(0, 100) + '...' : '',
                url: URLUtils.url('Blog-Detail', 'id', blog.custom.blogID).toString(),
                author: blog.custom.authorName || 'Anonymous'
            };
            
            this.blogs.push(blogItem);
        }
    }
}

module.exports = BlogSuggestions;