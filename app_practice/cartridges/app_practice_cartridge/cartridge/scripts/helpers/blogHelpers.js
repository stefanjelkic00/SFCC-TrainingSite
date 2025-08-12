'use strict';

const CustomObjectMgr = require('dw/object/CustomObjectMgr');

function formatBlogForDisplay(blog, includeEditUrl) {
    const URLUtils = require('dw/web/URLUtils');
    const Resource = require('dw/web/Resource');
    
    const formatted = {
        id: blog.custom.blogID,
        title: blog.custom.title || Resource.msg('blog.untitled', 'blog', null),
        content: blog.custom.content ? 
            (blog.custom.content.substring(0, 150) + 
            (blog.custom.content.length > 150 ? '...' : '')) : 
            Resource.msg('blog.no.content', 'blog', null),
        createdDate: blog.creationDate,
        lastModified: blog.lastModified,
        status: blog.custom.status || 'published',
        viewUrl: URLUtils.url('Blog-Detail', 'id', blog.custom.blogID).toString()
    };
    
    if (includeEditUrl) {
        formatted.editUrl = URLUtils.url('Blog-Edit', 'id', blog.custom.blogID).toString();
    }
    
    return formatted;
}

function formatBlogForList(blog) {
    const URLUtils = require('dw/web/URLUtils');
    const Resource = require('dw/web/Resource');
    
    return {
        id: blog.custom.blogID,
        title: blog.custom.title,
        content: blog.custom.content ? blog.custom.content.substring(0, 200) + '...' : '',
        author: blog.custom.authorName || Resource.msg('blog.anonymous', 'blog', null),
        createdDate: blog.creationDate,
        url: URLUtils.url('Blog-Detail', 'id', blog.custom.blogID).toString()
    };
}

function formatBlogForSearch(blog) {
    const URLUtils = require('dw/web/URLUtils');
    
    return {
        id: blog.custom.blogID,
        title: blog.custom.title || '',
        content: blog.custom.content ? blog.custom.content.substring(0, 200) + '...' : '',
        author: blog.custom.authorName || 'Anonymous',
        createdDate: blog.creationDate,
        url: URLUtils.url('Blog-Detail', 'id', blog.custom.blogID).toString()
    };
}

function getAllBlogs() {
    const iterator = CustomObjectMgr.queryCustomObjects(
        'Blog',
        '',
        'creationDate desc'
    );
    
    const blogs = [];
    while (iterator.hasNext()) {
        blogs.push(iterator.next());
    }
    iterator.close();
    
    return blogs;
}

function getUserBlogs(userID) {
    const iterator = CustomObjectMgr.queryCustomObjects(
        'Blog',
        'custom.author = {0}',
        'creationDate desc',
        userID
    );
    
    const blogs = [];
    while (iterator.hasNext()) {
        blogs.push(iterator.next());
    }
    iterator.close();
    
    return blogs;
}

function searchBlogs(searchTerm, maxResults) {
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
}

function getBlogSearchResultsChunk(searchTerm, startingPage, pageSize) {
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
        blogs.push(formatBlogForSearch(allBlogs[i]));
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
    formatBlogForDisplay,
    formatBlogForList,
    formatBlogForSearch,
    getBlogSearchResultsChunk,  
    getAllBlogs,
    getUserBlogs,
    searchBlogs,
};
