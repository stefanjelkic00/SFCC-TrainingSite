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
        if (data.title !== undefined) blog.custom.title = data.title;
        if (data.content !== undefined) blog.custom.content = data.content;
        if (data.author !== undefined) blog.custom.author = data.author;
        if (data.authorName !== undefined) blog.custom.authorName = data.authorName;
        if (data.status !== undefined) blog.custom.status = data.status;
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

function getAllBlogs() {
    const blogs = [];
    const iterator = CustomObjectMgr.queryCustomObjects(
        'Blog',
        'custom.status = {0}',
        'creationDate desc',
        'published'
    );
    
    while (iterator.hasNext()) {
        blogs.push(iterator.next());
    }
    iterator.close();
    
    return blogs;
}

function getUserBlogs(userID) {
    const blogs = [];
    const iterator = CustomObjectMgr.queryCustomObjects(
        'Blog',
        'custom.author = {0}',
        'creationDate desc',
        userID
    );
    
    while (iterator.hasNext()) {
        blogs.push(iterator.next());
    }
    iterator.close();
    
    return blogs;
}

function searchBlogs(searchTerm, maxResults) {
    if (!searchTerm || searchTerm.length < 2) {
        return [];
    }
    
    maxResults = maxResults || 10;
    const results = [];
    const searchPattern = '*' + searchTerm.toLowerCase() + '*';    
    
    const blogsIterator = CustomObjectMgr.queryCustomObjects(
        'Blog',
        'custom.title ILIKE {0} AND custom.status = {1}',
        'creationDate desc',
        searchPattern,
        'published'
    );
    
    let count = 0;
    while (blogsIterator.hasNext() && count < maxResults) {
        results.push(blogsIterator.next());
        count++;
    }
    blogsIterator.close();
    
    return results;
}


function formatBlogs(blogs, options) {
    const Blog = require('*/cartridge/models/blog');
    const URLUtils = require('dw/web/URLUtils');
    
    options = options || {};
    const blogsArray = Array.isArray(blogs) ? blogs : [blogs];
    
    const formattedBlogs = blogsArray.map(function(blogCustomObject) {
        const blog = new Blog(blogCustomObject);
        
        const formatted = {
            id: blog.id,
            title: blog.title || '',
            createdDate: blog.creationDate
        };
        
        if (options.fullContent && blog.content) {
            formatted.content = blog.content;
        } else if (options.shortExcerpt && blog.shortExcerpt) {
            formatted.content = blog.shortExcerpt;
        } else if (blog.excerpt) {
            formatted.content = blog.excerpt;
        }
        if (blog.author){
            formatted.author = blog.author;
        } 
        if (blog.authorName){
            formatted.authorName = blog.authorName;
        } 
        if (blog.status){
            formatted.status = blog.status;
        } 
        if (blog.lastModified){
            formatted.lastModified = blog.lastModified;
        } 
        
        formatted.url = URLUtils.url('Blog-Detail', 'id', blog.id).toString();
        formatted.viewUrl = formatted.url;
        formatted.editUrl = URLUtils.url('Blog-Edit', 'id', blog.id).toString();
        
        return formatted;
    });
    
    return Array.isArray(blogs) ? formattedBlogs : formattedBlogs[0];
}

module.exports = {
    createBlog,
    getBlogByID,
    updateBlog,
    deleteBlog,
    getAllBlogs,
    getUserBlogs,
    searchBlogs,
    formatBlogs
};