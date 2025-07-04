'use strict';

/**
 * Decorates the address object with the custom houseNr field using Object.defineProperty.
 * @param {Object} addressObj - The plain address model object to decorate.
 * @param {dw.customer.CustomerAddress|dw.order.OrderAddress} address - The SFCC address object.
 */
module.exports = function houseNr(addressObj, address) {
    let houseNrValue = '';
    
    if (address && address.constructor && address.constructor.name === 'dw.customer.CustomerAddress') {
        if (address.custom && address.custom.houseNr) {
            houseNrValue = address.custom.houseNr;
        }
    }
    
    Object.defineProperty(addressObj, 'houseNr', {
        enumerable: true,
        value: houseNrValue
    });
};