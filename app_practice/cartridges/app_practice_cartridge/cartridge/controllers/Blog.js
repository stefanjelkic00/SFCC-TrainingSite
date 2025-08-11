'use strict';

const server = require('server');
const csrfProtection = require('*/cartridge/scripts/middleware/csrf');
const userLoggedIn = require('*/cartridge/scripts/middleware/userLoggedIn');

server.get('List', function (req, res, next) {
    const BlogModel = require('*/cartridge/models/blog');
    const URLUtils = require('dw/web/URLUtils');
    const collections = require('*/cartridge/scripts/util/collections');
    
    const blogModel = new BlogModel();
    const blogsIterator = blogModel.getAllBlogs();
    
    const blogList = collections.map(blogsIterator, function(blog) {
        return {
            id: blog.custom.blogID,
            title: blog.custom.title,
            content: blog.custom.content ? blog.custom.content.substring(0, 200) + '...' : '',
            author: blog.custom.authorName || 'Anonymous',
            createdDate: blog.creationDate,
            url: URLUtils.url('Blog-Detail', 'id', blog.custom.blogID).toString()
        };
    });
    
    res.render('blog/blogList', {
        blogs: blogList,
        createUrl: URLUtils.url('Blog-Create').toString()
    });
    
    next();
});

server.get('Detail', function (req, res, next) {
    const BlogModel = require('*/cartridge/models/blog');
    const URLUtils = require('dw/web/URLUtils');
    const blogID = req.querystring.id;
    const blogModel = new BlogModel();
    const blog = blogModel.getBlogByID(blogID);

    
    res.render('blog/blogDetail', {
        blog: {
            id: blog.custom.blogID,
            title: blog.custom.title || 'Untitled',
            content: blog.custom.content || '',
            author: blog.custom.authorName || 'Anonymous',
            createdDate: blog.creationDate,
            lastModified: blog.lastModified
        },
        backUrl: URLUtils.url('Blog-List').toString()
    });
    
    next();
});

server.get('Create', 
    server.middleware.https,
    userLoggedIn.validateLoggedIn,
    csrfProtection.generateToken, 
    function (req, res, next) {
        const URLUtils = require('dw/web/URLUtils');
        const blogForm = server.forms.getForm('blog');
        blogForm.clear();
        
        res.render('blog/blogForm', {
            blogForm: blogForm,
            actionUrl: URLUtils.url('Blog-SaveBlog').toString(),
            cancelUrl: URLUtils.url('Account-MyBlogs').toString(),
            isEdit: false
        });
        
        next();
    }
);

server.get('Edit', 
    server.middleware.https,
    userLoggedIn.validateLoggedIn,
    csrfProtection.generateToken, 
    function (req, res, next) {
        const BlogModel = require('*/cartridge/models/blog');
        const URLUtils = require('dw/web/URLUtils');
        
        const blogID = req.querystring.id;
        
        if (!blogID) {
            res.redirect(URLUtils.url('Account-MyBlogs'));
            return next();
        }
        
        const blogModel = new BlogModel();
        const blog = blogModel.getBlogByID(blogID);
        
        if (!blog) {
            res.redirect(URLUtils.url('Account-MyBlogs'));
            return next();
        }
        
        const customerID = req.currentCustomer.raw.ID;
        
        if (blog.custom.author !== customerID) {
            res.redirect(URLUtils.url('Account-MyBlogs'));
            return next();
        }
        
        const blogForm = server.forms.getForm('blog');
        blogForm.title.value = blog.custom.title;
        blogForm.content.value = blog.custom.content;
        blogForm.blogID.value = blog.custom.blogID;
        
        res.render('blog/blogForm', {
            blogForm: blogForm,
            actionUrl: URLUtils.url('Blog-SaveBlog').toString(),
            cancelUrl: URLUtils.url('Account-MyBlogs').toString(),
            isEdit: true
        });
        
        next();
    }
);

server.post('SaveBlog', 
    csrfProtection.validateAjaxRequest, 
    function (req, res, next) {
        const BlogModel = require('*/cartridge/models/blog');
        const URLUtils = require('dw/web/URLUtils');
        
        if (!req.currentCustomer.profile) {
            res.json({ success: false, message: 'You must be logged in to save blogs' });
            return next();
        }
        
        const title = req.form.title ? req.form.title.trim() : '';
        const content = req.form.content ? req.form.content.trim() : '';
        const blogID = req.form.blogID ? req.form.blogID.trim() : '';
        
        if (!title || !content) {
            res.json({ 
                success: false, 
                message: !title ? 'Title is required' : 'Content is required' 
            });
            return next();
        }
        
        const blogModel = new BlogModel();
        const customer = req.currentCustomer.raw;
        
        if (blogID) {
            const existingBlog = blogModel.getBlogByID(blogID);
            
            if (!existingBlog) {
                res.json({ success: false, message: 'Blog not found' });
                return next();
            }
            
            if (existingBlog.custom.author !== customer.ID) {
                res.json({ success: false, message: 'You can only edit your own blogs' });
                return next();
            }
            
            const updateResult = blogModel.updateBlog(blogID, { title, content });
            
            res.json({
                success: updateResult,
                message: updateResult ? 'Blog updated successfully' : 'Failed to update blog',
                redirectUrl: updateResult ? URLUtils.url('Account-MyBlogs').toString() : null
            });
            return next();  
        }
        const blogData = {
            title,
            content,
            author: customer.ID,
            authorName: `${customer.profile.firstName || ''} ${customer.profile.lastName || ''}`.trim() || 'Anonymous',
            status: 'published'
        };
        const createResult = blogModel.createBlog(blogData);

        res.json({
            success: createResult.success,
            message: createResult.success ? 'Blog created successfully' : 'Failed to create blog',
            redirectUrl: createResult.success ? URLUtils.url('Account-MyBlogs').toString() : null
        });
        
        next();
    }
);

server.post('Delete', 
    csrfProtection.validateAjaxRequest,
    function (req, res, next) {
        const BlogModel = require('*/cartridge/models/blog');
        
        if (!req.currentCustomer.profile) {
            res.json({ success: false, message: 'You must be logged in to delete blogs' });
            return next();
        }
        
        const blogID = req.form.blogID;
        
        if (!blogID) {
            res.json({ success: false, message: 'Blog ID is required' });
            return next();
        }
        
        const blogModel = new BlogModel();
        const blog = blogModel.getBlogByID(blogID);
        
        if (!blog) {
            res.json({ success: false, message: 'Blog not found' });
            return next();
        }
        
        if (blog.custom.author !== req.currentCustomer.raw.ID) {
            res.json({ success: false, message: 'You can only delete your own blogs' });
            return next();
        }
        
        const result = blogModel.deleteBlog(blogID);
        
        res.json({
            success: result,
            message: result ? 'Blog deleted successfully' : 'Failed to delete blog'
        });
        
        next();
    }
);

server.get('Search', function (req, res, next) {
    const BlogModel = require('*/cartridge/models/blog');
    const URLUtils = require('dw/web/URLUtils');
    
    const searchTerm = req.querystring.q;
    
    if (!searchTerm || searchTerm.length < 2) {
        res.json({ suggestions: [] });
        return next();
    }
    
    const blogModel = new BlogModel();
    const blogs = blogModel.searchBlogs(searchTerm, 5);
    const suggestions = [];
    
    for (let i = 0; i < blogs.length; i++) {
        const blog = blogs[i];
        suggestions.push({
            value: blog.custom.title,
            url: URLUtils.url('Blog-Detail', 'id', blog.custom.blogID).toString()
        });
    }
    
    res.json({ suggestions: suggestions });
    next();
});

module.exports = server.exports();