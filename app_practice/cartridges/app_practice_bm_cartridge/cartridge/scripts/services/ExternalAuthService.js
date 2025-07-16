'use strict';

const LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');

const externalAuthService = LocalServiceRegistry.createService('external.auth.service', {
   createRequest: function(svc, credentials) {
       svc.setURL(svc.getURL() + '/login'); // Dodaje /login na base URL
       svc.setRequestMethod('POST');
       svc.addHeader('Content-Type', 'application/json');
       
       return JSON.stringify({
           username: credentials.username,
           password: credentials.password
       });
   },
   parseResponse: function(svc, response) {
       return JSON.parse(response.text);
   }
});

module.exports = externalAuthService;