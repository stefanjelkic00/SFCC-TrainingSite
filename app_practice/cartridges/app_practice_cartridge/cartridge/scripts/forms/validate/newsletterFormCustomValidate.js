'use strict';

/**
 * Validacija newsletter forme: provera imena, prezimena i e-mail adrese
 * @param {dw.web.FormGroup} formGroup - instanca forme newsletter
 * @returns {boolean} true ako su svi unosi validni, false ako su pronađene greške
 */

function validate(formGroup) {
    var isValid = true;

    var emailVal = formGroup.email.value;

    // Provera email adrese: built-in validacija (regexp, obavezno) + zabranjene reči
    if (!empty(emailVal)) {
        var lowerEmail = emailVal.toLowerCase();
        // Lista zabranjenih reči
        var forbiddenWords = ['test', 'admin', 'spam', 'dummy', 'invalid'];
        for (var i = 0; i < forbiddenWords.length; i++) {
            if (lowerEmail.indexOf(forbiddenWords[i]) !== -1) {
                formGroup.email.invalidateFormElement('error.email.forbidden.word');
                isValid = false;
                break;
            }
        }
    }

    // Vraćamo true samo ako nisu pronađene greške
    return isValid;
}

// Eksportujemo funkciju da bismo je mogli koristiti u XML formi
module.exports = { validate: validate };
