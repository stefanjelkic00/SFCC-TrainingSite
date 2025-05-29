'use strict';

const Site = require('dw/system/Site');

exports.validate = function (form) {
    const forbiddenWordsPref = Site.getCurrent().getCustomPreferenceValue('emailForbiddenWords');
    
    if (form.email.value && forbiddenWordsPref && forbiddenWordsPref.length) {
        const email = form.email.value.toLowerCase();
        
        // Umesto split() i for petlje - direktan regex test
        const forbiddenPattern = forbiddenWordsPref.map(word => word.toLowerCase()).join('|');
        const regex = new RegExp('\\b(' + forbiddenPattern + ')\\b[^@]*@');
        
        if (regex.test(email)) {
            form.email.invalidateFormElement('Email, Yahoo, Hotmail cant be set before @!');
            return false;
        }
    }
    
    return true;
};