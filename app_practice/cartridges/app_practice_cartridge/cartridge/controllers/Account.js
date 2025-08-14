'use strict';

const server = require('server');
server.extend(module.superModule);
const csrfProtection = require('*/cartridge/scripts/middleware/csrf');
const userLoggedIn = require('*/cartridge/scripts/middleware/userLoggedIn');

server.append('Show', function (req, res, next) {
    const URLUtils = require('dw/web/URLUtils');
    const profile = req.currentCustomer.raw && req.currentCustomer.raw.profile;
    const newsletterFirstName = profile && profile.custom.newsletterFirstName ? profile.custom.newsletterFirstName : '';
    const newsletterLastName = profile && profile.custom.newsletterLastName ? profile.custom.newsletterLastName : '';
    const newsletterEmail = profile && profile.custom.newsletterEmail ? profile.custom.newsletterEmail : '';
    
    res.setViewData({
        newsletterFirstName: newsletterFirstName,
        newsletterLastName: newsletterLastName,
        newsletterEmail: newsletterEmail,
        myBlogsUrl: URLUtils.url('Account-MyBlogs').toString()
    });
    return next();
});

server.post(
    'ExternalLogin',
    server.middleware.https,
    csrfProtection.validateAjaxRequest,
    function (req, res, next) {
        const URLUtils = require('dw/web/URLUtils');
        const CustomerMgr = require('dw/customer/CustomerMgr');
        const Transaction = require('dw/system/Transaction');
        const Resource = require('dw/web/Resource');
        const authService = require('*/cartridge/scripts/services/auth');
        
        const result = authService.call({
            username: req.form.loginEmail,
            password: req.form.loginPassword
        });
        
        if (result.ok && result.object && result.object.success) {
            Transaction.wrap(function () {
                const customer = CustomerMgr.createExternallyAuthenticatedCustomer(
                    'CustomAuth',
                    result.object.user.id
                );
                
                if (customer && result.object.user) {
                    const profile = customer.getProfile();
                    const userData = result.object.user;
                    
                    if (userData.firstName) {
                        profile.setFirstName(userData.firstName);
                    }
                    if (userData.lastName) {
                        profile.setLastName(userData.lastName);
                    }
                    if (userData.email) {
                        profile.setEmail(userData.email);
                    }
                }
                
                CustomerMgr.loginExternallyAuthenticatedCustomer('CustomAuth', result.object.user.id, false);
            });
            
            res.json({
                success: true,
                redirectUrl: URLUtils.url('Account-Show').toString()
            });
        } else {
            const errorMessages = result.object && result.object.error
                ? result.object.error
                : Resource.msg('error.authentication.failed', 'account', null);
            
            res.json({
                error: [errorMessages]
            });
        }
        
        return next();
    }
);

server.get('MyBlogs', 
    server.middleware.https,
    userLoggedIn.validateLoggedIn,
    csrfProtection.generateToken,
    function (req, res, next) {
        const blogHelpers = require('*/cartridge/scripts/helpers/blogHelpers');
        const BlogModel = require('*/cartridge/models/blog');
        const URLUtils = require('dw/web/URLUtils');
        const Resource = require('dw/web/Resource');
        const customerID = req.currentCustomer.raw.ID;
        const userBlogsData = blogHelpers.getUserBlogs(customerID);
        
        const blogList = userBlogsData.map(function(blogCustomObject) {
            const blogData = BlogModel.getBlog(blogCustomObject);
            return BlogModel.getDisplayView(blogData, true); 
        });
        
        res.render('account/myBlogs', {
            blogs: blogList,
            createBlogUrl: URLUtils.url('Blog-Create').toString(),
            breadcrumbs: [
                {
                    htmlValue: Resource.msg('global.home', 'common', null),
                    url: URLUtils.home().toString()
                },
                {
                    htmlValue: Resource.msg('page.title.myaccount', 'account', null),
                    url: URLUtils.url('Account-Show').toString()
                },
                {
                    htmlValue: Resource.msg('account.myblogs.title', 'account', null),
                    url: ''
                }
            ],
            accountlanding: false
        });
        
        next();
    }
);

module.exports = server.exports();