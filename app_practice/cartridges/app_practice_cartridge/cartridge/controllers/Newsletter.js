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

    const { firstName, lastName, email } = req.form;
    const forbiddenWords = ['email', 'test', 'user','demo','hack'];

    let errors = {};
    
    if (!nameRegex.test(firstName)) {
        errors.newsletterFirstName = 'First name must contain only letters.';
    }

    if (!nameRegex.test(lastName)) {
        errors.newsletterLastName = 'Last name must contain only letters.';
    }
    
    if (!emailRegex.test(email)) {
        errors.newsletterEmail = 'Invalid email format.';
    }
    
    if (forbiddenWords.some(word => email.toLowerCase().includes(word))) {
        errors.newsletterEmail = 'Email contains forbidden words.';
    }

    if (Object.keys(errors).length > 0) {
        res.json({ success: false, errors: errors });
        return next();
    }

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