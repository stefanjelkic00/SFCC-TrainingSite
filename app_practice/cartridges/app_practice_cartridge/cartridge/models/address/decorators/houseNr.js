'use strict';

/**
 * Decorates the address object with the custom houseNr field using Object.defineProperty.
 * @param {Object} addressObj - The plain address model object to decorate.
 * @param {dw.customer.CustomerAddress} address - The real SFCC address object.
 */
module.exports = function houseNr(addressObj, address) {
    if (!addressObj || !address) {
        return;
    }
    Object.defineProperty(addressObj, 'houseNr', {
        enumerable: true,
        value:
            (address.custom && address.custom.houseNr) ||
            (address.raw && address.raw.custom && address.raw.custom.houseNr) ||
            ''
    });
}; 