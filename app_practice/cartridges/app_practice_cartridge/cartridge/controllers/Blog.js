'use strict';

const server = require('server');
const csrfProtection = require('*/cartridge/scripts/middleware/csrf');
const userLoggedIn = require('*/cartridge/scripts/middleware/userLoggedIn');

server.get('List', function (req, res, next) {
    const blogHelpers = require('*/cartridge/scripts/helpers/blogHelpers');
    const URLUtils = require('dw/web/URLUtils');
    const blogs = blogHelpers.getAllBlogs();
    const blogList = blogs.map(function(blog) {
        return blogHelpers.formatBlogForList(blog);
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
    const Resource = require('dw/web/Resource');
    const blogID = req.querystring.id;
    const blog = BlogModel.getBlogByID(blogID);

    if (!blog) {
        res.render('error', {
            message: Resource.msg('blog.error.not.found', 'blog', null)
        });
        return next();
    }
    
    res.render('blog/blogDetail', {
        blog: {
            id: blog.custom.blogID,
            title: blog.custom.title || Resource.msg('blog.untitled', 'blog', null),
            content: blog.custom.content || '',
            author: blog.custom.authorName || Resource.msg('blog.anonymous', 'blog', null),
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
        
        const blog = BlogModel.getBlogByID(blogID);
        
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
        blogForm.clear();
        blogForm.copyFrom({
            title: blog.custom.title,
            content: blog.custom.content,
            blogID: blog.custom.blogID
        });
        
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
    server.middleware.https,
    userLoggedIn.validateLoggedIn,
    csrfProtection.validateAjaxRequest, 
    function (req, res, next) {
        const BlogModel = require('*/cartridge/models/blog');
        const URLUtils = require('dw/web/URLUtils');
        const Resource = require('dw/web/Resource');
        const formErrors = require('*/cartridge/scripts/formErrors');
        
        const blogForm = server.forms.getForm('blog');
        blogForm.copyFrom(req.form);
        
        if (!blogForm.valid) {
            res.json({
                success: false,
                fields: formErrors.getFormErrors(blogForm)
            });
            return next();
        }
        
        const title = blogForm.title.htmlValue ? blogForm.title.htmlValue.trim() : '';
        const content = blogForm.content.htmlValue ? blogForm.content.htmlValue.trim() : '';
        const blogID = blogForm.blogID.htmlValue ? blogForm.blogID.htmlValue.trim() : '';
        
        if (!title || !content) {
            res.json({ 
                success: false, 
                message: !title 
                    ? Resource.msg('blog.error.title.required', 'blog', null) 
                    : Resource.msg('blog.error.content.required', 'blog', null)
            });
            return next();
        }
        
        const customer = req.currentCustomer.raw;
        
        if (blogID) {
            const existingBlog = BlogModel.getBlogByID(blogID);
            
            if (!existingBlog) {
                res.json({ 
                    success: false, 
                    message: Resource.msg('blog.error.not.found', 'blog', null)
                });
                return next();
            }
            
            if (existingBlog.custom.author !== customer.ID) {
                res.json({ 
                    success: false, 
                    message: Resource.msg('blog.error.edit.permission', 'blog', null)
                });
                return next();
            }
            
            const updateResult = BlogModel.updateBlog(blogID, { title, content });
            
            res.json({
                success: updateResult,
                message: updateResult 
                    ? Resource.msg('blog.success.updated', 'blog', null)
                    : Resource.msg('blog.error.update.failed', 'blog', null),
                redirectUrl: updateResult ? URLUtils.url('Account-MyBlogs').toString() : null
            });
            return next();  
        }
        
        const blogData = {
            title,
            content,
            author: customer.ID,
            authorName: `${customer.profile.firstName || ''} ${customer.profile.lastName || ''}`.trim() || Resource.msg('blog.anonymous', 'blog', null),
            status: 'published'
        };
        
        const createResult = BlogModel.createBlog(blogData);

        res.json({
            success: createResult.success,
            message: createResult.success 
                ? Resource.msg('blog.success.created', 'blog', null)
                : Resource.msg('blog.error.create.failed', 'blog', null),
            redirectUrl: createResult.success ? URLUtils.url('Account-MyBlogs').toString() : null
        });
        
        next();
    }
);

server.post('Delete', 
    server.middleware.https,
    userLoggedIn.validateLoggedIn,
    csrfProtection.validateAjaxRequest,
    function (req, res, next) {
        const BlogModel = require('*/cartridge/models/blog');
        const Resource = require('dw/web/Resource');        
        const blogID = req.form.blogID;
        
        if (!blogID) {
            res.json({ 
                success: false, 
                message: Resource.msg('blog.error.id.required', 'blog', null)
            });
            return next();
        }
        
        const blog = BlogModel.getBlogByID(blogID);
        
        if (!blog) {
            res.json({ 
                success: false, 
                message: Resource.msg('blog.error.not.found', 'blog', null)
            });
            return next();
        }
        
        if (blog.custom.author !== req.currentCustomer.raw.ID) {
            res.json({ 
                success: false, 
                message: Resource.msg('blog.error.delete.permission', 'blog', null)
            });
            return next();
        }
        
        const result = BlogModel.deleteBlog(blogID);
        
        res.json({
            success: result,
            message: result 
                ? Resource.msg('blog.success.deleted', 'blog', null)
                : Resource.msg('blog.error.delete.failed', 'blog', null)
        });
        
        next();
    }
);

module.exports = server.exports();