'use strict';

function processForm(req, paymentForm, viewFormData) {
    const viewData = viewFormData;
    viewData.paymentMethod = {
        value: paymentForm.paymentMethod.value,
        htmlName: paymentForm.paymentMethod.htmlName
    };
    return {
        error: false,
        viewData: viewData
    };
}

function savePaymentInformation(req, basket, billingData) {
}

exports.processForm = processForm;
exports.savePaymentInformation = savePaymentInformation;