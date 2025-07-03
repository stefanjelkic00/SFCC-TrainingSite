'use strict';

var server = require('server');
var page = module.superModule;
server.extend(page);

server.prepend('Show', function (req, res, next) {
    var Logger = require('dw/system/Logger');
    var CustomerMgr = require('dw/customer/CustomerMgr');
    var Transaction = require('dw/system/Transaction');
    var session = req.session.raw;
    
    Logger.error('=== PRODUCT CONTROLLER 50OFF CHECK ===');
    
    var srcParam = req.querystring.src;
    var currentPid = req.querystring.pid;
    
    Logger.error('session.customer exists: ' + (session.customer ? 'YES' : 'NO'));
    Logger.error('session.customer.authenticated: ' + session.customer.authenticated);
    Logger.error('session.customer.profile exists: ' + (session.customer.profile ? 'YES' : 'NO'));
    
    // Detaljnije logovanje
    if (session.customer && session.customer.profile) {
        Logger.error('Customer email: ' + session.customer.profile.email);
        Logger.error('Customer login: ' + session.customer.profile.credentials.login);
        Logger.error('Session ID: ' + session.sessionID);
    }
    
    // Proveri da li je korisnik tek ulogovan (nema session flag ali je u grupi)
    if (session.customer.authenticated && !session.privacy.has50offPromo && srcParam !== '50off') {
        try {
            var customerGroup50off = CustomerMgr.getCustomerGroup('50off');
            if (customerGroup50off) {
                var currentCustomer = session.customer;
                var customerGroups = currentCustomer.customerGroups;
                var isInGroup = false;
                
                for (var i = 0; i < customerGroups.length; i++) {
                    if (customerGroups[i].ID === '50off') {
                        isInGroup = true;
                        break;
                    }
                }
                
                if (isInGroup) {
                    Logger.error('Found stale 50off membership from previous session - removing');
                    
                    try {
                        // Pokušaj 1: Preko CustomerMgr
                        var customer = CustomerMgr.getCustomerByCustomerNumber(currentCustomer.profile.customerNo);
                        if (customer) {
                            Transaction.wrap(function () {
                                customerGroup50off.removeCustomer(customer);
                                Logger.error('Tried removeCustomer method');
                            });
                        }
                    } catch (e1) {
                        Logger.error('removeCustomer failed: ' + e1.message);
                        
                        // Pokušaj 2: Preko customer objekta direktno
                        try {
                            Transaction.wrap(function () {
                                currentCustomer.removeFromCustomerGroup(customerGroup50off);
                                Logger.error('Tried removeFromCustomerGroup method');
                            });
                        } catch (e2) {
                            Logger.error('removeFromCustomerGroup failed: ' + e2.message);
                            
                            // Pokušaj 3: Original metoda
                            try {
                                Transaction.wrap(function () {
                                    customerGroup50off.unassignCustomer(currentCustomer);
                                    Logger.error('Tried unassignCustomer method');
                                });
                            } catch (e3) {
                                Logger.error('unassignCustomer failed: ' + e3.message);
                            }
                        }
                    }
                    
                    // Proveri ponovo da li je stvarno uklonjen
                    var stillInGroup = false;
                    var updatedGroups = currentCustomer.customerGroups;
                    for (var j = 0; j < updatedGroups.length; j++) {
                        if (updatedGroups[j].ID === '50off') {
                            stillInGroup = true;
                            break;
                        }
                    }
                    Logger.error('After removal - still in group: ' + stillInGroup);
                }
            }
        } catch (e) {
            Logger.error('Error cleaning stale membership: ' + e.message);
        }
    }
    
    // Check if user comes with src=50off OR already has the session flag
    if (srcParam === '50off' || session.privacy.has50offPromo === true) {
        
        if (srcParam === '50off') {
            Logger.error('DETECTED src=50off parameter for product: ' + currentPid);
            // Prvi put - postavi početni flag
            session.privacy.first50offAccess = true;
        } else {
            Logger.error('User already has 50off promotion in session');
        }
        
        // Set session flags
        session.custom.is50offEligible = true;
        session.privacy.has50offPromo = true;
        
        // For authenticated users, ensure they're in the customer group
        if (session.customer.authenticated) {
            try {
                var customerGroup50off = CustomerMgr.getCustomerGroup('50off');
                Logger.error('Customer group found: ' + (customerGroup50off ? 'YES' : 'NO'));
                
                if (customerGroup50off) {
                    var currentCustomer = session.customer;
                    Logger.error('Using session.customer: ' + currentCustomer);
                    Logger.error('Customer ID: ' + (currentCustomer ? currentCustomer.ID : 'NO ID'));
                    Logger.error('Customer profile email: ' + (currentCustomer.profile ? currentCustomer.profile.email : 'NO EMAIL'));
                    
                    // Check if customer is already member
                    var customerGroups = currentCustomer.customerGroups;
                    var isInGroup = false;
                    
                    for (var i = 0; i < customerGroups.length; i++) {
                        if (customerGroups[i].ID === '50off') {
                            isInGroup = true;
                            break;
                        }
                    }
                    Logger.error('Is customer in group: ' + isInGroup);
                    
                    if (!isInGroup) {
                        Transaction.wrap(function () {
                            customerGroup50off.assignCustomer(currentCustomer);
                            Logger.error('Successfully added customer to 50off group');
                        });
                        
                        // Set notification only on first add
                        if (srcParam === '50off') {
                            req.session.privacyCache.set('promotionActivated', true);
                        }
                    } else {
                        Logger.error('Customer already in 50off group');
                    }
                }
            } catch (e) {
                Logger.error('Error managing customer group: ' + e.message);
            }
        } else {
            Logger.error('Guest user - using session flags only');
        }
    } else {
        Logger.error('No src=50off parameter and no session flag');
        // NE UKLANJAMO iz grupe - ostaje tokom cele sesije!
    }
    
    Logger.error('Session state - is50offEligible: ' + session.custom.is50offEligible);
    Logger.error('=== END CONTROLLER CHECK ===');
    next();
});

module.exports = server.exports();