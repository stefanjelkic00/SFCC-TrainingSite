'use strict';

const assert = require('chai').assert;
const AccountMock = require('../mocks/models/account');
const AddressMock = require('../mocks/models/address');

describe('Account Model with Mocks', function() {
    
    describe('Account Creation', function() {
        it('should create account with profile data', function() {
            const accountData = {
                firstName: 'John',
                lastName: 'Doe',
                email: 'john@example.com',
                registered: true
            };
            
            const account = new AccountMock(accountData);
            assert.deepEqual(account.profile, {
                firstName: 'John',
                lastName: 'Doe',
                email: 'john@example.com',
                birthday: null,
                customerNo: '',
                phone: ''
            });
            assert.isTrue(account.isRegistered());
        });
    });
    
    describe('Address Management', function() {
        it('should add address to account', function() {
            const account = new AccountMock({ firstName: 'Jane' });
            const address = new AddressMock({
                address1: '123 Main St',
                city: 'Boston',
                stateCode: 'MA',
                postalCode: '02101'
            });
            
            account.addAddress(address);
            
            assert.equal(account.addressBook.addresses.length, 1);
            assert.equal(account.getPreferredAddress(), address);
        });
        
        it('should compare addresses correctly', function() {
            const address1 = new AddressMock({
                address1: '123 Main St',
                city: 'Boston',
                stateCode: 'MA',
                postalCode: '02101'
            });
            
            const address2 = new AddressMock({
                address1: '123 Main St',
                city: 'Boston',
                stateCode: 'MA',
                postalCode: '02101'
            });
            
            assert.isTrue(address1.isEquivalentAddress(address2));
        });
    });
    
    describe('Prototype Chain', function() {
        it('should demonstrate prototype chain', function() {
            const account = new AccountMock({ firstName: 'Test' });
            assert.equal(account.__proto__.constructor, AccountMock);
            assert.equal(account.__proto__.__proto__.constructor, Object);
            assert.equal(account.getProfile, AccountMock.prototype.getProfile);
            assert.isTrue(account.hasOwnProperty('profile'));
            assert.isFalse(account.hasOwnProperty('getProfile'));
        });
        
        it('should get complete prototype chain', function() {
            const account = new AccountMock({});
            const chain = account.getPrototypeChain();
            
            assert.deepEqual(chain, ['AccountMock', 'Object', 'Object']);
        });
    });
});