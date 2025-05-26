'use strict';

const BaseAccountModel = require('app_storefront_base/cartridge/models/account');

const newsletterDecorator = require('./newsletter/decorators/newsletter');


function Account(currentCustomer, addressModel, orderModel) {

    // Call the base model to get all standard properties
    BaseAccountModel.call(this, currentCustomer, addressModel, orderModel);

    // Decorate the plain profile object with newsletter fields
    if (this.profile && currentCustomer.profile) {
        newsletterDecorator(this.profile, currentCustomer.profile);
    }

}

module.exports = Account;