'use strict';

const Site = require('dw/system/Site');

/**
 * Proverava da li email sadrži zabranjenu reč iz site preference liste
 */
function containsForbiddenEmailDomain(email) {
    const forbiddenWords = Site.getCurrent().getCustomPreferenceValue('emailForbiddenWords') || [];
    return forbiddenWords.some((word) => email.toLowerCase().includes(word.toLowerCase()));
}

function validate(form) {
    const result = {
        firstName: { valid: true, error: '' },
        lastName: { valid: true, error: '' },
        email: { valid: true, error: '' }
    };

    if (containsForbiddenEmailDomain(form.email.value)) {
        result.email.valid = false;
        result.email.error = 'Email contains a forbidden word.';
    }

    return result;
}

exports.validate = validate;
