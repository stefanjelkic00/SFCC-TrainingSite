'use strict';

const AddressMock = require('./address');

function AccountMock(customerData) {
    if (customerData) {
        this.profile = {
            firstName: customerData.firstName || '',
            lastName: customerData.lastName || '',
            email: customerData.email || '',
            phone: customerData.phone || '',
            customerNo: customerData.customerNo || '',
            birthday: customerData.birthday || null
        };
        
        this.addressBook = {
            addresses: customerData.addresses || [],
            preferredAddress: customerData.preferredAddress || null
        };
        
        this.registered = customerData.registered || false;
        this.authenticated = customerData.authenticated || false;
    }
}

AccountMock.prototype.getProfile = function() {
    return {
        firstName: this.profile.firstName,
        lastName: this.profile.lastName,
        email: this.profile.email,
        phone: this.profile.phone,
        fullName: this.profile.firstName + ' ' + this.profile.lastName
    };
};

AccountMock.prototype.addAddress = function(address) {
    if (!this.addressBook.addresses) {
        this.addressBook.addresses = [];
    }
    this.addressBook.addresses.push(address);
    if (this.addressBook.addresses.length === 1) {
        this.addressBook.preferredAddress = address;
    }
};

AccountMock.prototype.setPreferredAddress = function(address) {
    this.addressBook.preferredAddress = address;
};

AccountMock.prototype.getPreferredAddress = function() {
    return this.addressBook.preferredAddress;
};

AccountMock.prototype.isRegistered = function() {
    return this.registered === true;
};

AccountMock.prototype.isAuthenticated = function() {
    return this.authenticated === true;
};

AccountMock.prototype.getPrototypeChain = function() {
    return ['AccountMock', 'Object', 'Object'];
};

module.exports = AccountMock;