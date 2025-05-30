'use strict';

const baseHelpers = require('app_storefront_base/cartridge/scripts/helpers/accountHelpers');

/**
 * Saves newsletter data to the customer profile custom attributes.
 * @param {dw.customer.Customer} customer - The customer object
 * @param {Object} formData - The form data { firstName, lastName, email }
 */


function saveNewsletterData(customer, formData) {
    
    const profile = customer.getProfile();
    if (!profile) return;

    if (profile.custom) {
        profile.custom.newsletterFirstName = formData.firstName || '';
        profile.custom.newsletterLastName = formData.lastName || '';
        profile.custom.newsletterEmail = formData.email || '';
    }

}

module.exports = Object.assign({}, baseHelpers, {

    saveNewsletterData

});