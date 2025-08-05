'use strict';

function customer(customerData) {
    if (customerData) {
        this.email = customerData.email || '';
        this.firstName = customerData.firstName || '';
        this.lastName = customerData.lastName || '';
        this.phone = customerData.phone || '';
        this.isRegistered = customerData.isRegistered || false;
    }
}

customer.prototype.getFullName = function() {
    return (this.firstName + ' ' + this.lastName).trim();
};

customer.prototype.isValidEmail = function() {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(this.email);
};

customer.prototype.getStatus = function() {
    return this.isRegistered ? 'Registered' : 'Guest';
};

module.exports = customer;