'use strict';

var server = require('server');
var page = module.superModule;
server.extend(page);

server.prepend('Show', function (req, res, next) {
    var Logger = require('dw/system/Logger');
    var session = req.session.raw;
    
    Logger.error('=== PRODUCT CONTROLLER 50OFF CHECK ===');
    Logger.error('Query string: ' + JSON.stringify(req.querystring));
    
    var srcParam = req.querystring.src;
    
    if (srcParam === '50off') {
        Logger.error('DETEKTOVAN src=50off parametar!');
        
        // Postavi session flags - ovo ce raditi za sve korisnike
        session.custom.is50offEligible = true;
        session.privacy.has50offPromo = true;
        
        Logger.error('Session flags postavljeni:');
        Logger.error('- is50offEligible: ' + session.custom.is50offEligible);
        Logger.error('- has50offPromo: ' + session.privacy.has50offPromo);
        
        // Za registrovane korisnike pokusaj da dodas u grupu
        if (session.customer.authenticated && session.customer.profile) {
            try {
                var CustomerMgr = require('dw/customer/CustomerMgr');
                var customerGroup = CustomerMgr.getCustomerGroup('50off');
                
                if (customerGroup) {
                    session.customer.profile.addToCustomerGroup(customerGroup);
                    Logger.error('Registrovan korisnik dodat u 50off grupu');
                }
            } catch (e) {
                Logger.error('Greska pri dodavanju registrovanog korisnika u grupu: ' + e.message);
            }
        } else {
            Logger.error('Guest korisnik - koristi samo session flags');
        }
        
    } else {
        Logger.error('Nema src=50off parametra');
    }
    
    Logger.error('=== KRAJ CONTROLLER CHECK ===');
    
    next();
});

module.exports = server.exports();