'use strict';

const CustomObjectMgr = require('dw/object/CustomObjectMgr');
const Transaction = require('dw/system/Transaction');
const UUIDUtils = require('dw/util/UUIDUtils');

function createBlog(data) {
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
}

function getBlogByID(blogID) {
    return CustomObjectMgr.getCustomObject('Blog', blogID);
}

function updateBlog(blogID, data) {
    const blog = getBlogByID(blogID);
    
    if (!blog) {
        return false;
    }
    
    Transaction.wrap(function() {
        blog.custom.title = data.title || blog.custom.title;
        blog.custom.content = data.content || blog.custom.content;
        blog.custom.status = data.status || blog.custom.status;
    });
    
    return true;
}

function deleteBlog(blogID) {
    const blog = getBlogByID(blogID);
    
    if (!blog) {
        return false;
    }
    
    Transaction.wrap(function() {
        CustomObjectMgr.remove(blog);
    });
    
    return true;
}

module.exports = {
    createBlog,
    getBlogByID,
    updateBlog,
    deleteBlog
};