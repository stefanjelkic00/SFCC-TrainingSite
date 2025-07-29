'use strict';

const server = require('server');
server.extend(module.superModule);
const csrfProtection = require('*/cartridge/scripts/middleware/csrf');

server.append('Show', function (req, res, next) {
    const profile = req.currentCustomer.raw && req.currentCustomer.raw.profile;
    const newsletterFirstName = profile && profile.custom.newsletterFirstName ? profile.custom.newsletterFirstName : '';
    const newsletterLastName = profile && profile.custom.newsletterLastName ? profile.custom.newsletterLastName : '';
    const newsletterEmail = profile && profile.custom.newsletterEmail ? profile.custom.newsletterEmail : '';
    
    res.setViewData({
        newsletterFirstName: newsletterFirstName,
        newsletterLastName: newsletterLastName,
        newsletterEmail: newsletterEmail
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
                : Resource.msg('Authentication failed. Please check your credentials.');
            
            res.json({
                error: [errorMessages]
            });
        }
        
        return next();
    }
);

module.exports = server.exports();