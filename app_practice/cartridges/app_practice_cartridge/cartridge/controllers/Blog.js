'use strict';

const server = require('server');
const csrfProtection = require('*/cartridge/scripts/middleware/csrf');
const userLoggedIn = require('*/cartridge/scripts/middleware/userLoggedIn');

server.get('List', function (req, res, next) {
    const blogHelpers = require('*/cartridge/scripts/helpers/blogHelpers');
    const BlogModel = require('*/cartridge/models/blog');
    const URLUtils = require('dw/web/URLUtils');
    
    const blogsData = blogHelpers.getAllBlogs();
    const blogList = blogsData.map(function(blogCustomObject) {
        const blogData = BlogModel.getBlog(blogCustomObject);
        return BlogModel.getListView(blogData);
    });
    
    res.render('blog/blogList', {
        blogs: blogList,
        createUrl: URLUtils.url('Blog-Create').toString()
    });
    
    next();
});

server.get('Detail', function (req, res, next) {
    const blogHelpers = require('*/cartridge/scripts/helpers/blogHelpers');
    const BlogModel = require('*/cartridge/models/blog');
    const URLUtils = require('dw/web/URLUtils');
    const Resource = require('dw/web/Resource');
    
    const blogID = req.querystring.id;
    const blogCustomObject = blogHelpers.getBlogByID(blogID);

    if (!blogCustomObject) {
        res.render('error', {
            message: Resource.msg('blog.error.not.found', 'blog', null)
        });
        return next();
    }
    
    const blogData = BlogModel.getBlog(blogCustomObject);
    
    res.render('blog/blogDetail', {
        blog: BlogModel.getDetailView(blogData),
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
        const blogHelpers = require('*/cartridge/scripts/helpers/blogHelpers');
        const BlogModel = require('*/cartridge/models/blog');
        const URLUtils = require('dw/web/URLUtils');
        
        const blogID = req.querystring.id;
        
        if (!blogID) {
            res.redirect(URLUtils.url('Account-MyBlogs'));
            return next();
        }
        
        const blogCustomObject = blogHelpers.getBlogByID(blogID);
        
        if (!blogCustomObject) {
            res.redirect(URLUtils.url('Account-MyBlogs'));
            return next();
        }
        
        const customerID = req.currentCustomer.raw.ID;
        
        if (blogCustomObject.custom.author !== customerID) {
            res.redirect(URLUtils.url('Account-MyBlogs'));
            return next();
        }
        
        const blogData = BlogModel.getBlog(blogCustomObject);
        const blogForm = server.forms.getForm('blog');
        blogForm.clear();
        blogForm.copyFrom(BlogModel.getFormData(blogData));
        
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
   function (req, res, next) {
       const blogHelpers = require('*/cartridge/scripts/helpers/blogHelpers');
       const URLUtils = require('dw/web/URLUtils');
       const Resource = require('dw/web/Resource');
       const formErrors = require('*/cartridge/scripts/formErrors');
       
       const blogForm = server.forms.getForm('blog');
       blogForm.clear();
       blogForm.copyFrom(req.form);
       
       if (!blogForm.valid) {
           res.json({
               success: false,
               fields: formErrors.getFormErrors(blogForm)
           });
           return next();
       }
       
       const title = blogForm.title.value;
       const content = blogForm.content.value;
       const blogID = blogForm.blogID.value || '';
       const customer = req.currentCustomer.raw;
       
       if (blogID) {
           const existingBlog = blogHelpers.getBlogByID(blogID);
           
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
           
           const updateResult = blogHelpers.updateBlog(blogID, { title, content });
           
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
       
       const createResult = blogHelpers.createBlog(blogData);

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
    function (req, res, next) {
        const blogHelpers = require('*/cartridge/scripts/helpers/blogHelpers');
        const Resource = require('dw/web/Resource');
        
        const blogID = req.form.blogID;
        
        if (!blogID) {
            res.json({ 
                success: false, 
                message: Resource.msg('blog.error.id.required', 'blog', null)
            });
            return next();
        }
        
        const blog = blogHelpers.getBlogByID(blogID);
        
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
        
        const result = blogHelpers.deleteBlog(blogID);
        
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