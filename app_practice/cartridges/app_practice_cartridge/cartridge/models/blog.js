'use strict';

const Resource = require('dw/web/Resource');

function Blog(blogCustomObject) {
    
    this.id = blogCustomObject.custom.blogID;
    this.title = blogCustomObject.custom.title || '';
    this.content = blogCustomObject.custom.content || '';
    
    this.author = blogCustomObject.custom.author || '';
    this.authorName = blogCustomObject.custom.authorName || Resource.msg('blog.anonymous', 'blog', null);
    
    this.status = blogCustomObject.custom.status || 'published';
    this.creationDate = blogCustomObject.creationDate;
    this.lastModified = blogCustomObject.lastModified;
    
    const content = this.content;
    this.excerpt = content ? 
        (content.substring(0, 200) + (content.length > 200 ? '...' : '')) : '';
    this.shortExcerpt = content ? 
        (content.substring(0, 150) + (content.length > 150 ? '...' : '')) : '';
}

module.exports = Blog;