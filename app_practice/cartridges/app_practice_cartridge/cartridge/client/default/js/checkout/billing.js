'use strict';

const base = require('base/checkout/billing');

base.methods.updatePaymentInformation = function(order) {
    const $paymentSummary = $('.payment-details');
    let htmlToAppend = '';

    if (order.billing.payment && order.billing.payment.selectedPaymentInstruments
        && order.billing.payment.selectedPaymentInstruments.length > 0) {
        
        const instrument = order.billing.payment.selectedPaymentInstruments[0];
        
        if (instrument.paymentMethod === 'CASH_ON_DELIVERY') {
            htmlToAppend = '<div class="cash-on-delivery-summary">' +
                '<div class="payment-method-name">' +
                '<span>Payment in cash.</span>' +
                '</div>' +
                '</div>';
        } else {
            htmlToAppend += '<span>' + order.resources.cardType + ' '
                + instrument.type
                + '</span><div>'
                + instrument.maskedCreditCardNumber
                + '</div><div><span>'
                + order.resources.cardEnding + ' '
                + instrument.expirationMonth
                + '/' + instrument.expirationYear
                + '</span></div>';
        }
    }

    $paymentSummary.empty().append(htmlToAppend);
};

base.paymentTabs = function () {
    $('body').on('click', '.payment-options .nav-item', function (e) {
        e.preventDefault();
        const methodID = $(this).data('method-id');
        $('.payment-information').data('payment-method-id', methodID);
        
        $('.payment-options .nav-link').removeClass('active');
        $('.tab-pane').removeClass('active show');
        
        $(this).find('.nav-link').addClass('active');
        
        if (methodID === 'CASH_ON_DELIVERY') {
            $('#credit-card-content').removeClass('active show');
            $('#cash-on-delivery-content').addClass('active show');
            $('input[name$="_paymentMethod"]').val('CASH_ON_DELIVERY');
            
            $('.payment-details').html(
                '<div class="cash-on-delivery-summary">' +
                '<div class="payment-method-name">' +
                '<span>Payment in cash.</span>' +
                '</div>' +
                '</div>'
            );
            
        } else if (methodID === 'CREDIT_CARD') {
            $('#credit-card-content').addClass('active show');
            $('#cash-on-delivery-content').removeClass('active show');
            $('input[name$="_paymentMethod"]').val('CREDIT_CARD');
            
            $('.payment-details').html(
                '<span>Credit undefined</span><br>' +
                '<span>undefined</span><br>' +
                '<span>Ending undefined/undefined</span>'
            );
        }
    });
};

module.exports = base;