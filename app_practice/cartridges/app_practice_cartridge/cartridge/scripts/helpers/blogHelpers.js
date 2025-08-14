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
    maxResults = maxResults || 50;
    const results = [];
    const searchPattern = '*' + searchTerm + '*';
    
    const blogsIterator = CustomObjectMgr.queryCustomObjects(
        'Blog',
        'custom.title ILIKE {0} OR custom.content ILIKE {0}',
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
}

function getBlogSearchResultsChunk(searchTerm, startingPage, pageSize) {
    const BlogModel = require('*/cartridge/models/blog');
    const URLUtils = require('dw/web/URLUtils');
    
    if (!searchTerm) {
        return {
            blogs: [],
            blogCount: 0,
            moreContentUrl: null,
            searchTerm: searchTerm,
            hasMessage: true
        };
    }
    
    const allBlogs = searchBlogs(searchTerm, 100);
    const blogs = [];
    
    const startIndex = startingPage || 0;
    const endIndex = Math.min(startIndex + pageSize, allBlogs.length);
    
    for (let i = startIndex; i < endIndex; i++) {
        const blogModel = new BlogModel(allBlogs[i]);
        blogs.push(blogModel.getSearchView());
    }
    
    const moreContentUrl = endIndex < allBlogs.length 
        ? URLUtils.url('Search-BlogContent', 'q', searchTerm, 'startingPage', endIndex).toString()
        : null;
    
    return {
        blogs: blogs,
        blogCount: allBlogs.length,
        moreContentUrl: moreContentUrl,  
        searchTerm: searchTerm,
        hasMessage: startIndex === 0
    };
}

module.exports = {
    createBlog,
    getBlogByID,
    updateBlog,
    deleteBlog,
    getAllBlogs,
    getUserBlogs,
    searchBlogs,
    getBlogSearchResultsChunk
};