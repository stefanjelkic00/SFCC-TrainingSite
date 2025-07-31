'use strict';

const Transaction = require('dw/system/Transaction');
const collections = require('*/cartridge/scripts/util/collections');

function Handle(basket, paymentInformation, paymentMethodID, req) {
    const serverErrors = [];
    const error = false;

    Transaction.wrap(function () {
        collections.forEach(basket.getPaymentInstruments(), function (paymentInstrument) {
            basket.removePaymentInstrument(paymentInstrument);
        });

        basket.createPaymentInstrument(
            paymentMethodID,
            basket.totalGrossPrice
        );
    });

    return { error: error, serverErrors: serverErrors };
}

function Authorize(orderNumber, paymentInstrument, paymentProcessor) {
    const serverErrors = [];
    const fieldErrors = {};
    const error = false;

    Transaction.wrap(function () {
        paymentInstrument.paymentTransaction.setTransactionID(orderNumber);
        paymentInstrument.paymentTransaction.setPaymentProcessor(paymentProcessor);
    });

    return { fieldErrors: fieldErrors, serverErrors: serverErrors, error: error };
}

exports.Handle = Handle;
exports.Authorize = Authorize;
