'use strict';

const server = require('server');
server.extend(module.superModule);

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

server.prepend('Login', function (req, res, next) {
    const Site = require('dw/system/Site');
    const useExternalAuth = Site.getCurrent().getCustomPreferenceValue('useExternalAuthentication');
    
    if (useExternalAuth) {
        if (!req.form.loginEmail || !req.form.loginPassword) {
            res.json({
                error: ['Email and password are required']
            });
            this.emit('route:Complete', req, res);
            return;
        }
        
        const URLUtils = require('dw/web/URLUtils');
        const CustomerMgr = require('dw/customer/CustomerMgr');
        const Transaction = require('dw/system/Transaction');
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
                CustomerMgr.loginExternallyAuthenticatedCustomer('CustomAuth', result.object.user.id, false);
            });
            
            res.json({
                success: true,
                redirectUrl: URLUtils.url('Account-Show').toString(),
                user: result.object.user || null 
            });
            this.emit('route:Complete', req, res);
            return;
        } else {
            const errorMessages = result.object && result.object.error 
                ? result.object.error 
                : 'Authentication failed. Please check your credentials.';
            
            res.json({
                error: [errorMessages]  
            });
            this.emit('route:Complete', req, res);
            return;
        }
    }
    
    next();
});

module.exports = server.exports();