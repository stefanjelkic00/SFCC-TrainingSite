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
    
    // Samo proveri da li je src=50off
    if (srcParam === '50off') {
        Logger.error('DETECTED src=50off parameter for product: ' + currentPid);
        
        if (session.customer.authenticated) {
            try {
                var customerGroup50off = CustomerMgr.getCustomerGroup('50off');
                
                if (customerGroup50off) {
                    // VAŽNO: Uvek koristi CustomerMgr da dobiješ najsvežiji objekat
                    var customerNo = session.customer.profile.customerNo;
                    var customer = CustomerMgr.getCustomerByCustomerNumber(customerNo);
                    
                    if (customer) {
                        // Proveri trenutne grupe preko CustomerMgr objekta
                        var isInGroup = customer.isMemberOfCustomerGroup('50off');
                        
                        if (!isInGroup) {
                            Logger.error('Customer NOT in group, adding...');
                            
                            Transaction.wrap(function () {
                                customerGroup50off.assignCustomer(customer);
                            });
                            
                            // Ne verifikuj odmah - samo postavi flag da je pokušano
                            session.custom.pendingGroupAssignment = true;
                            session.custom.groupAssignmentTime = new Date().getTime();
                            
                            // Postavi notifikaciju
                            req.session.privacyCache.set('promotionActivated', true);
                            Logger.error('Group assignment initiated - may take a moment to propagate');
                            
                        } else {
                            Logger.error('Customer already in 50off group');
                            // Očisti pending flag ako postoji
                            delete session.custom.pendingGroupAssignment;
                        }
                    }
                }
            } catch (e) {
                Logger.error('Error: ' + e.message);
            }
        }
    }
    
    // Proveri pending assignment sa prethodnog pokušaja
    if (session.custom.pendingGroupAssignment && session.customer.authenticated) {
        var timeSinceAssignment = new Date().getTime() - (session.custom.groupAssignmentTime || 0);
        
        // Ako je prošlo više od 2 sekunde, proveri ponovo
        if (timeSinceAssignment > 2000) {
            var customerNo = session.customer.profile.customerNo;
            var customer = CustomerMgr.getCustomerByCustomerNumber(customerNo);
            
            if (customer && customer.isMemberOfCustomerGroup('50off')) {
                Logger.error('Confirmed: Customer now in 50off group');
                delete session.custom.pendingGroupAssignment;
            }
        }
    }
    
    next();
});

module.exports = server.exports();