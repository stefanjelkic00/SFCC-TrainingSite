'use strict';

const Site = require('dw/system/Site');

exports.validate = function (form) {
    
    const forbiddenWordsPref = Site.getCurrent().getCustomPreferenceValue('emailForbiddenWords');

    if (form.email.value && forbiddenWordsPref && forbiddenWordsPref.length) {

        const email = form.email.value.toLowerCase();

        const emailName = email.split('@')[0]; 

        for (let i = 0; i < forbiddenWordsPref.length; i++) {
            
            if (emailName.includes(forbiddenWordsPref[i])) {
                form.email.invalidateFormElement('Email, Yahoo, Hotmail cant be set before @!');
                return false;
            }
        }
    }

    return true;
};
