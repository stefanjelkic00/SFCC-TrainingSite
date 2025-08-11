'use strict';

const CustomObjectMgr = require('dw/object/CustomObjectMgr');
const Transaction = require('dw/system/Transaction');
const UUIDUtils = require('dw/util/UUIDUtils');

function BlogModel() {}

BlogModel.prototype.createBlog = function(data) {
    const result = { 
        success: false, 
        blog: null 
    };
    
    Transaction.wrap(function() {
        const uniqueBlogID = 'BLOG_' + UUIDUtils.createUUID();
        const blog = CustomObjectMgr.createCustomObject('Blog', uniqueBlogID);
        
        blog.custom.blogID = uniqueBlogID;
        blog.custom.title = data.title || '';
        blog.custom.content = data.content || '';
        blog.custom.author = data.author || '';
        blog.custom.authorName = data.authorName || '';
        blog.custom.status = data.status || 'published';
        
        result.success = true;
        result.blog = blog;
    });
    
    return result;
};

BlogModel.prototype.getBlogByID = function(blogID) {
    return CustomObjectMgr.getCustomObject('Blog', blogID);
};

BlogModel.prototype.getAllBlogs = function() {
    return CustomObjectMgr.queryCustomObjects(
        'Blog',
        '',
        'creationDate desc'
    );
};

BlogModel.prototype.getUserBlogs = function(userID) {
    return CustomObjectMgr.queryCustomObjects(
        'Blog',
        'custom.author = {0}',
        'creationDate desc',
        userID
    );
};

BlogModel.prototype.updateBlog = function(blogID, data) {
    const blog = this.getBlogByID(blogID);
    
    if (!blog){
        return false;
    }
    
    Transaction.wrap(function() {
        blog.custom.title = data.title || blog.custom.title;
        blog.custom.content = data.content || blog.custom.content;
        blog.custom.status = data.status || blog.custom.status;
    });
    
    return true;
};

BlogModel.prototype.deleteBlog = function(blogID) {
 
    const blog = this.getBlogByID(blogID);
    
    if (!blog) {
        return false;
    }
    
    Transaction.wrap(function() {
        CustomObjectMgr.remove(blog);
    });
    
    return true;
};

BlogModel.prototype.searchBlogs = function(searchTerm, maxResults) {
    maxResults = maxResults || 5;
    const results = [];
    const searchPattern = '*' + searchTerm + '*';
    
    const blogsIterator = CustomObjectMgr.queryCustomObjects(
        'Blog',
        'custom.title ILIKE {0}',
        'creationDate desc',
        searchPattern
    );
    
    let count = 0;
    while (blogsIterator.hasNext() && count < maxResults) {
        results.push(blogsIterator.next());
        count++;
    }
    blogsIterator.close();
    
    return results;
};

BlogModel.prototype.getRecentBlogs = function(limit) {
    const iterator = this.getAllBlogs();
    const blogs = [];
    for (let i = 0; i < (limit || 12) && iterator.hasNext(); i++) {
        blogs.push(iterator.next());
    }
    iterator.close();
    return blogs;
};
module.exports = BlogModel;