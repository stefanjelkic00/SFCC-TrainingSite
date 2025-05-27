'use strict';

const server = require('server');
const CustomerMgr = require('dw/customer/CustomerMgr');
const formErrors = require('*/cartridge/scripts/formErrors');

const URLUtils = require('dw/web/URLUtils');
const Transaction = require('dw/system/Transaction');
const csrfProtection = require('*/cartridge/scripts/middleware/csrf');




server.get('Show', function (req, res, next) {

    const profile = req.currentCustomer.raw && req.currentCustomer.raw.profile;

    res.render('account/newsletterCard', {
        newsletterFirstName: profile && profile.custom.newsletterFirstName ? profile.custom.newsletterFirstName : '',
        newsletterLastName: profile && profile.custom.newsletterLastName ? profile.custom.newsletterLastName : '',
        newsletterEmail: profile && profile.custom.newsletterEmail ? profile.custom.newsletterEmail : ''
    });

    next();

});


// server.post('Save',
//     csrfProtection.validateAjaxRequest,
//     function (req, res, next) {

//     const profile = req.currentCustomer.raw && req.currentCustomer.raw.profile;
//     if (profile && profile.custom) {
//         Transaction.wrap(function () {
//             profile.custom.newsletterFirstName = req.form.firstName;
//             profile.custom.newsletterLastName = req.form.lastName;
//             profile.custom.newsletterEmail = req.form.email;
//         });
//     }

//     res.json({
//         success: true,
//         msg: 'Subscription successful!',
//         redirectUrl: URLUtils.url('Account-Show').toString()
//     });

//     return next();

// });
server.post('Save', csrfProtection.validateAjaxRequest, function (req, res, next) {
    const newsletterForm = server.forms.getForm('newsletter');
    if (!newsletterForm.valid) {
        res.json({
            success: false,
            fields: formErrors.getFormErrors(newsletterForm)
        });
        return next();
    }


    // Hardcoded forbidden email domains
    const forbiddenWords = ['gmail', 'yahoo', 'hotmail'];
    const email = req.form.email.toLowerCase();
    const isForbidden = forbiddenWords.some((word) => email.includes(word));
    if (isForbidden) {
        res.json({
            success: false,
            fields: {
                newsletterEmail: 'Email contains a forbidden word.'
            }
        });
        return next();
    }



    const customer = CustomerMgr.getCustomerByCustomerNumber(req.currentCustomer.profile.customerNo);
    const profile = customer.profile; //  bitno

    Transaction.wrap(function () {
      profile.custom.newsletterFirstName = req.form.firstName;
      profile.custom.newsletterLastName = req.form.lastName;
      profile.custom.newsletterEmail = req.form.email;
    });
    res.json({
        success: true,
        msg: 'Newsletter info saved!',
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