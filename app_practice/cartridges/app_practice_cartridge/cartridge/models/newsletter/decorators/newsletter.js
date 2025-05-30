'use strict';

/**
 * Decorates the profile object with newsletter custom attributes.
 * @param {object} profileObj - The plain profile model object to decorate.
 * @param {dw.customer.Profile} profile - The real SFCC profile object.
 */

module.exports = function newsletterDecorator(profileObj, profile) {
    if (!profileObj || !profile || !profile.custom) return;

    Object.defineProperty(profileObj, 'newsletterFirstName', {
        enumerable: true,
        value: profile.custom.newsletterFirstName || ''
    });

    Object.defineProperty(profileObj, 'newsletterLastName', {
        enumerable: true,
        value: profile.custom.newsletterLastName || ''
    });

    Object.defineProperty(profileObj, 'newsletterEmail', {
        enumerable: true,
        value: profile.custom.newsletterEmail || ''
    });
};
