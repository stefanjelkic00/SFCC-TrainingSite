'use strict';

const assert = require('chai').assert;
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();

describe('Customer Model', function () {
    const Customer = require('../../../../cartridges/app_practice_cartridge/cartridge/models/customer');

    describe('Constructor', function () {
        it('should create customer with all provided data', function () {
            const customerData = {
                email: 'test@example.com',
                firstName: 'John',
                lastName: 'Doe', 
                phone: '123-456-7890',
                isRegistered: true
            };

            const customer = new Customer(customerData);
            assert.deepEqual(Object.assign({}, customer), customerData);
        });

        it('should handle null customer data', function () {
            const customer = new Customer(null);
            assert.deepEqual(Object.assign({}, customer), {});
        });

        it('should handle empty customer data object', function () {
            const customer = new Customer({});

            const expectedResult = {
                email: '',
                firstName: '',
                lastName: '',
                phone: '',
                isRegistered: false
            };

            assert.deepEqual(Object.assign({}, customer), expectedResult);
        });

        it('should handle partial customer data', function () {
            const customerData = {
                email: 'partial@test.com',
                firstName: 'Jane'
            };

            const customer = new Customer(customerData);

            const expectedResult = {
                email: 'partial@test.com',
                firstName: 'Jane',
                lastName: '',
                phone: '',
                isRegistered: false
            };

            assert.deepEqual(Object.assign({}, customer), expectedResult);
        });
    });

    describe('getFullName method', function () {
        it('should return full name when both names are provided', function () {
            const customer = new Customer({
                firstName: 'John',
                lastName: 'Doe'
            });

            assert.equal(customer.getFullName(), 'John Doe');
        });

        it('should trim extra spaces', function () {
            const customer = new Customer({
                firstName: ' John ',
                lastName: ' Doe '
            });

            assert.equal(customer.getFullName(), 'John   Doe');
        });

        it('should handle missing last name', function () {
            const customer = new Customer({
                firstName: 'John'
            });

            assert.equal(customer.getFullName(), 'John');
        });

        it('should handle missing first name', function () {
            const customer = new Customer({
                lastName: 'Doe'
            });

            assert.equal(customer.getFullName(), 'Doe');
        });

        it('should return empty string for no names', function () {
            const customer = new Customer({});

            assert.equal(customer.getFullName(), '');
        });
    });

    describe('isValidEmail method', function () {
        it('should validate correct email format', function () {
            const customer = new Customer({
                email: 'test@example.com'
            });

            assert.isTrue(customer.isValidEmail());
        });

        it('should validate email with subdomain', function () {
            const customer = new Customer({
                email: 'test@mail.example.com'
            });

            assert.isTrue(customer.isValidEmail());
        });

        it('should invalidate email without @', function () {
            const customer = new Customer({
                email: 'testexample.com'
            });

            assert.isFalse(customer.isValidEmail());
        });

        it('should invalidate email without domain', function () {
            const customer = new Customer({
                email: 'test@'
            });

            assert.isFalse(customer.isValidEmail());
        });

        it('should invalidate email without extension', function () {
            const customer = new Customer({
                email: 'test@example'
            });

            assert.isFalse(customer.isValidEmail());
        });

        it('should invalidate empty email', function () {
            const customer = new Customer({
                email: ''
            });

            assert.isFalse(customer.isValidEmail());
        });

        it('should invalidate email with spaces', function () {
            const customer = new Customer({
                email: 'test @example.com'
            });

            assert.isFalse(customer.isValidEmail());
        });
    });

    describe('getStatus method', function () {
        it('should return Registered for registered customer', function () {
            const customer = new Customer({
                isRegistered: true
            });

            assert.equal(customer.getStatus(), 'Registered');
        });

        it('should return Guest for non-registered customer', function () {
            const customer = new Customer({
                isRegistered: false
            });

            assert.equal(customer.getStatus(), 'Guest');
        });

        it('should return Guest when isRegistered is not provided', function () {
            const customer = new Customer({});

            assert.equal(customer.getStatus(), 'Guest');
        });
    });
});