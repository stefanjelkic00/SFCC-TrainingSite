'use strict';

module.exports = function houseNr(addressObj, address) {
    if (!addressObj || !address) {
        return;
    }
    
    Object.defineProperty(addressObj, 'houseNr', {
        enumerable: true,
        value: (address.custom && 'houseNr' in address.custom && address.custom.houseNr) || 
               ('raw' in address && address.raw && address.raw.custom && 'houseNr' in address.raw.custom && address.raw.custom.houseNr) || 
               ''
    });
};