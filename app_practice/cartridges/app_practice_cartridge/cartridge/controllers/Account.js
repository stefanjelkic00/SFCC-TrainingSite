'use strict';

const server = require('server');

server.extend(module.superModule);

server.append('Show', function (req, res, next) {

    const profile = req.currentCustomer.raw && req.currentCustomer.raw.profile;
    const newsletterFirstName = profile && profile.custom.newsletterFirstName ? profile.custom.newsletterFirstName : '';
    const newsletterLastName = profile && profile.custom.newsletterLastName ? profile.custom.newsletterLastName : '';
    const newsletterEmail = profile && profile.custom.newsletterEmail ? profile.custom.newsletterEmail : '';
    
    res.setViewData({
        newsletterFirstName: newsletterFirstName,
        newsletterLastName: newsletterLastName,
        newsletterEmail: newsletterEmail
    });
    return next();
});

module.exports = server.exports();