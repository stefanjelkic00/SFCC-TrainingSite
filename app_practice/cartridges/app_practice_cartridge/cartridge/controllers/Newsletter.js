'use strict';

const server = require('server');
const URLUtils = require('dw/web/URLUtils');
const csrfProtection = require('*/cartridge/scripts/middleware/csrf');
const userLoggedIn = require('*/cartridge/scripts/middleware/userLoggedIn');
const consentTracking = require('*/cartridge/scripts/middleware/consentTracking');
const CustomerMgr = require('dw/customer/CustomerMgr');
const Transaction = require('dw/system/Transaction');
const formErrors = require('*/cartridge/scripts/formErrors');
const accountHelpers = require('*/cartridge/scripts/helpers/accountHelpers');

server.get(
    'Show',
    csrfProtection.generateToken,
    userLoggedIn.validateLoggedIn,
    consentTracking.consent,
    function (req, res, next) {
        const newsletterForm = server.forms.getForm('newsletter');
        newsletterForm.clear();

        const customer = CustomerMgr.getCustomerByCustomerNumber(req.currentCustomer.profile.customerNo);
        if (customer) {
            newsletterForm.firstName.value = customer.profile.custom.newsletterFirstName || '';
            newsletterForm.lastName.value = customer.profile.custom.newsletterLastName || '';
            newsletterForm.email.value = customer.profile.custom.newsletterEmail || '';
        }

        res.render('account/newsletterForm', {
            newsletterForm: newsletterForm,
            breadcrumbs: [
                { htmlValue: 'Home', url: '/' },
                { htmlValue: 'My Account', url: URLUtils.url('Account-Show').toString() },
                { htmlValue: 'Newsletter Signup' }
            ]
        });

        next();
    }
);

server.post('Save', csrfProtection.validateAjaxRequest, function (req, res, next) {
    const Logger = require('dw/system/Logger');
    let newsletterForm;

    try {
        newsletterForm = server.forms.getForm('newsletter');

        if (!newsletterForm.valid) {
            res.json({
                success: false,
                fields: formErrors.getFormErrors(newsletterForm)
            });
            return next();
        }
    } catch (e) {
        Logger.error('Newsletter form processing failed: {0}', e.message);
        res.json({
            success: false,
            msg: 'Unexpected error occurred while saving newsletter.'
        });
        return next();
    }

    const customer = CustomerMgr.getCustomerByCustomerNumber(req.currentCustomer.profile.customerNo);

    Transaction.wrap(function () {
        accountHelpers.saveNewsletterData(customer, {
            firstName: newsletterForm.firstName.htmlValue,
            lastName: newsletterForm.lastName.htmlValue,
            email: newsletterForm.email.htmlValue
        });
    });

    res.json({
        success: true,
        msg: 'Newsletter preferences saved!',
        redirectUrl: URLUtils.url('Account-Show').toString()
    });

    return next();
});

module.exports = server.exports();
