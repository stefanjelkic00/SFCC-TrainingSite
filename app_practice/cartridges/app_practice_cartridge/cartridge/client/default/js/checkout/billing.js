'use strict';

const base = require('base/checkout/billing');
 
base.paymentTabs = function () {
    $('body').on('click', '.payment-options .nav-item', function (e) {
        e.preventDefault();
        var methodID = $(this).data('method-id');
        $('.payment-information').data('payment-method-id', methodID);
        
        $('.payment-options .nav-link').removeClass('active');
        $('.tab-pane').removeClass('active show');
        
        $(this).find('.nav-link').addClass('active');
        
        if (methodID === 'CASH_ON_DELIVERY') {
            $('#credit-card-content').removeClass('active show');
            $('#cash-on-delivery-content').addClass('active show');
            $('input[name$="_paymentMethod"]').val('CASH_ON_DELIVERY');
        } else if (methodID === 'CREDIT_CARD') {
            $('#credit-card-content').addClass('active show');
            $('#cash-on-delivery-content').removeClass('active show');
            $('input[name$="_paymentMethod"]').val('CREDIT_CARD');
        }
    });
};

module.exports = base;