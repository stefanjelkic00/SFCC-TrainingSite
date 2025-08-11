'use strict';

const CustomObjectMgr = require('dw/object/CustomObjectMgr');
const collections = require('*/cartridge/scripts/util/collections');

function getUserBlogCount(customerID) {
    const blogsIterator = CustomObjectMgr.queryCustomObjects(
        'Blog',
        'custom.author = {0}',
        null,
        customerID
    );
    
    const count = blogsIterator.count;
    blogsIterator.close();
    
    return count || 0;
}

function getRecentBlogs(limit) {
    limit = limit || 10;
    const blogs = [];
    
    const allBlogs = CustomObjectMgr.queryCustomObjects(
        'Blog',
        'custom.status = {0}',
        'creationDate desc',
        'published'
    );
    
    let count = 0;
    while (allBlogs.hasNext() && count < limit) {
        const blog = allBlogs.next();
        blogs.push({
            id: blog.custom.blogID,
            title: blog.custom.title,
            author: blog.custom.authorName,
            date: blog.creationDate
        });
        count++;
    }
    allBlogs.close();
    
    return blogs;
}

module.exports = {
    getUserBlogCount: getUserBlogCount,
    getRecentBlogs: getRecentBlogs,
};