'use strict';

var ForbiddenEmailValidator = {
    validate: function(value) {
        var forbiddenWords = ['gmail', 'yahoo', 'hotmail', 'outlook'];
        var emailName = value.split('@')[0].toLowerCase();
        for (var i = 0; i < forbiddenWords.length; i++) {
            if (emailName.indexOf(forbiddenWords[i]) !== -1) {
                return {
                    valid: false,
                    error: 'Email cannot contain ' + forbiddenWords[i]
                };
            }
        }
        return { valid: true };
    }
};

function updateNewsletterFields(profileCustom, newsletterFormObj) {
    profileCustom.newsletterFirstName = newsletterFormObj.firstName || '';
    profileCustom.newsletterLastName = newsletterFormObj.lastName || '';
    profileCustom.newsletterEmail = newsletterFormObj.email || '';
    profileCustom.newsletterSubscribed = true;
}

module.exports = {
    ForbiddenEmailValidator: ForbiddenEmailValidator,
    updateNewsletterFields: updateNewsletterFields
}; 