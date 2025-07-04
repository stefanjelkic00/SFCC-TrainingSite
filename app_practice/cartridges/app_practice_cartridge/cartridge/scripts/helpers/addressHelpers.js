'use strict';

const base = require('app_storefront_base/cartridge/scripts/helpers/addressHelpers');


function updateAddressFields(newAddress, address) {

    base.updateAddressFields(newAddress, address);

    newAddress.custom.houseNr = address.houseNr || '';
    
}

module.exports = Object.assign({}, base, {
    updateAddressFields: updateAddressFields
});
