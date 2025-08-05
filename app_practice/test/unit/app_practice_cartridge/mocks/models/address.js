'use strict';

function AddressMock(addressData) {
    if (addressData) {
        this.firstName = addressData.firstName || '';
        this.lastName = addressData.lastName || '';
        this.address1 = addressData.address1 || '';
        this.address2 = addressData.address2 || '';
        this.city = addressData.city || '';
        this.postalCode = addressData.postalCode || '';
        this.stateCode = addressData.stateCode || '';
        this.countryCode = addressData.countryCode || 'US';
        this.phone = addressData.phone || '';
    }
}

AddressMock.prototype.isEquivalentAddress = function(otherAddress) {
    if (!otherAddress) return false;
    
    return this.address1 === otherAddress.address1 &&
           this.city === otherAddress.city &&
           this.postalCode === otherAddress.postalCode &&
           this.stateCode === otherAddress.stateCode;
};

AddressMock.prototype.getFullAddress = function() {
    const parts = [
        this.address1,
        this.address2,
        this.city,
        this.stateCode,
        this.postalCode
    ].filter(Boolean);
    
    return parts.join(', ');
};

module.exports = AddressMock;