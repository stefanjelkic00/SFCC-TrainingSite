'use strict';

const assert = require('chai').assert;
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();

describe('Account and Address Models', function() {
    
    describe('Newsletter Decorator', function() {
        it('should add newsletter properties to profile', function() {
            const newsletterDecorator = require('../../../../cartridges/app_practice_cartridge/cartridge/models/newsletter/decorators/newsletter');
            
            const profileObj = {};
            const profile = {
                custom: {
                    newsletterFirstName: 'John',
                    newsletterLastName: 'Doe',
                    newsletterEmail: 'john@newsletter.com'
                }
            };
            
            newsletterDecorator(profileObj, profile);
            
            assert.deepEqual(Object.assign({}, profileObj), {
                newsletterFirstName: 'John',
                newsletterLastName: 'Doe',
                newsletterEmail: 'john@newsletter.com'
            });
        });
        
        it('should handle missing custom properties', function() {
            const newsletterDecorator = require('../../../../cartridges/app_practice_cartridge/cartridge/models/newsletter/decorators/newsletter');           
            const profileObj = {};
            const profile = { custom: {} };
            
            newsletterDecorator(profileObj, profile);
            
            assert.deepEqual(Object.assign({}, profileObj), {
                newsletterFirstName: '',
                newsletterLastName: '',
                newsletterEmail: ''
            });
        });
    });
    
    describe('House Number Decorator', function() {
        it('should add house number to address', function() {
            const houseNrDecorator = require('../../../../cartridges/app_practice_cartridge/cartridge/models/address/decorators/houseNr');           
            const addressObj = {};
            const address = {
                custom: {
                    houseNr: '123A'
                }
            };
            
            houseNrDecorator(addressObj, address);
            
            assert.deepEqual(Object.assign({}, addressObj), {
                houseNr: '123A'
            });
        });
        
        it('should handle missing house number', function() {
            const houseNrDecorator = require('../../../../cartridges/app_practice_cartridge/cartridge/models/address/decorators/houseNr');
            const addressObj = {};
            const address = { custom: {} };
            
            houseNrDecorator(addressObj, address);
            
            assert.deepEqual(Object.assign({}, addressObj), {
                houseNr: ''
            });
        });
    });
    
    describe('Model Integration with Mocked Base Classes', function() {
        it('should create Account with newsletter properties', function() {
            const BaseAccountMock = function(customer) {
                this.profile = customer.profile;
                this.addresses = [];
                this.registeredUser = customer.authenticated && customer.registered;
            };
            
            const Account = proxyquire('../../../../cartridges/app_practice_cartridge/cartridge/models/account', {
                'app_storefront_base/cartridge/models/account': BaseAccountMock
            });
            
            const customer = {
                profile: {
                    firstName: 'Jane',
                    lastName: 'Smith',
                    email: 'jane@example.com',
                    custom: {
                        newsletterFirstName: 'Jane',
                        newsletterLastName: 'Smith',
                        newsletterEmail: 'jane@newsletter.com'
                    }
                },
                authenticated: true,
                registered: true
            };
            
            const account = new Account(customer);
            
            assert.deepEqual(Object.assign({}, account.profile), {
                firstName: 'Jane',
                lastName: 'Smith',
                email: 'jane@example.com',
                custom: {
                    newsletterFirstName: 'Jane',
                    newsletterLastName: 'Smith',
                    newsletterEmail: 'jane@newsletter.com'
                },
                newsletterFirstName: 'Jane',
                newsletterLastName: 'Smith',
                newsletterEmail: 'jane@newsletter.com'
            });
        });
    });
});