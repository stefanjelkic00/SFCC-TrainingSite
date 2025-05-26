'use strict';

const server = require('server');
const URLUtils = require('dw/web/URLUtils');
const Transaction = require('dw/system/Transaction');
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const nameRegex = /^[A-Za-z]+$/;
const csrfProtection = require('*/cartridge/scripts/middleware/csrf');
const Logger = require('dw/system/Logger');



server.get('Show', function (req, res, next) {

    const profile = req.currentCustomer.raw && req.currentCustomer.raw.profile;

    res.render('account/newsletterCard', {
        newsletterFirstName: profile && profile.custom.newsletterFirstName ? profile.custom.newsletterFirstName : '',
        newsletterLastName: profile && profile.custom.newsletterLastName ? profile.custom.newsletterLastName : '',
        newsletterEmail: profile && profile.custom.newsletterEmail ? profile.custom.newsletterEmail : ''
    });

    next();

});


server.post('Save',
    csrfProtection.validateAjaxRequest,
    function (req, res, next) {

    const profile = req.currentCustomer.raw && req.currentCustomer.raw.profile;
    if (profile && profile.custom) {
        Transaction.wrap(function () {
            profile.custom.newsletterFirstName = req.form.firstName;
            profile.custom.newsletterLastName = req.form.lastName;
            profile.custom.newsletterEmail = req.form.email;
        });
    }

    res.json({
        success: true,
        msg: 'Subscription successful!',
        redirectUrl: URLUtils.url('Account-Show').toString()
    });

    return next();

});


server.get('Edit',
    csrfProtection.generateToken,
    function (req, res, next) {
        const profile = req.currentCustomer.raw && req.currentCustomer.raw.profile;
        res.render('account/newsletterForm', {
            newsletterFirstName: profile && profile.custom.newsletterFirstName ? profile.custom.newsletterFirstName : '',
            newsletterLastName: profile && profile.custom.newsletterLastName ? profile.custom.newsletterLastName : '',
            newsletterEmail: profile && profile.custom.newsletterEmail ? profile.custom.newsletterEmail : ''
        });
        next();
    }
);


module.exports = server.exports();