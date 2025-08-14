'use strict';

const Resource = require('dw/web/Resource');
const URLUtils = require('dw/web/URLUtils');

function getBlog(blogCustomObject) {
    const content = blogCustomObject.custom.content || '';
    
    return {
        id: blogCustomObject.custom.blogID,
        title: blogCustomObject.custom.title || '',
        content: content,
        author: blogCustomObject.custom.author || '',
        authorName: blogCustomObject.custom.authorName || Resource.msg('blog.anonymous', 'blog', null),
        status: blogCustomObject.custom.status || 'published',
        creationDate: blogCustomObject.creationDate,
        lastModified: blogCustomObject.lastModified,
        excerpt: content ? 
            (content.substring(0, 200) + (content.length > 200 ? '...' : '')) : '',
        shortExcerpt: content ? 
            (content.substring(0, 150) + (content.length > 150 ? '...' : '')) : ''
    };
}

function getListView(blog) {
    return {
        id: blog.id,
        title: blog.title || Resource.msg('blog.untitled', 'blog', null),
        content: blog.excerpt,
        author: blog.authorName,
        createdDate: blog.creationDate,
        url: URLUtils.url('Blog-Detail', 'id', blog.id).toString()
    };
}

function getDetailView(blog) {
    return {
        id: blog.id,
        title: blog.title || Resource.msg('blog.untitled', 'blog', null),
        content: blog.content,
        author: blog.authorName,
        createdDate: blog.creationDate,
        lastModified: blog.lastModified
    };
}

function getSearchView(blog) {
    return {
        id: blog.id,
        title: blog.title || '',
        content: blog.excerpt,
        author: blog.authorName,
        createdDate: blog.creationDate,
        url: URLUtils.url('Blog-Detail', 'id', blog.id).toString()
    };
}

function getDisplayView(blog, includeEditUrl) {
    const formatted = {
        id: blog.id,
        title: blog.title || Resource.msg('blog.untitled', 'blog', null),
        content: blog.shortExcerpt || Resource.msg('blog.no.content', 'blog', null),
        createdDate: blog.creationDate,
        lastModified: blog.lastModified,
        status: blog.status,
        viewUrl: URLUtils.url('Blog-Detail', 'id', blog.id).toString()
    };
    
    if (includeEditUrl) {
        formatted.editUrl = URLUtils.url('Blog-Edit', 'id', blog.id).toString();
    }
    
    return formatted;
}

function getFormData(blog) {
    return {
        title: blog.title,
        content: blog.content,
        blogID: blog.id
    };
}

module.exports = {
    getBlog: getBlog,
    getListView: getListView,
    getDetailView: getDetailView,
    getSearchView: getSearchView,
    getDisplayView: getDisplayView,
    getFormData: getFormData
};