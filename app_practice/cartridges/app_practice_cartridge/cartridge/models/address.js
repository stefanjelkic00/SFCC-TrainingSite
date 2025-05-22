'use strict';

const BaseAddressModel = require('app_storefront_base/cartridge/models/address');
const houseNumberDecorator = require('./address/decorators/houseNr');

/**
 * @param {dw.customer.CustomerAddress} addressObject
 * @constructor
 */
function Address(addressObject) {
    BaseAddressModel.call(this, addressObject);
    houseNumberDecorator(this.address, addressObject);
}

module.exports = Address;