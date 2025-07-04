'use strict';
const decorateHouseNr = require('*/cartridge/models/address/decorators/houseNr');

function Address(addressObject) {

    module.superModule.call(this, addressObject);
    
    decorateHouseNr(this.address, addressObject);

}

module.exports = Address;