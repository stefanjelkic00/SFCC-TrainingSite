'use strict';

const server = require('server');
const page = module.superModule;
server.extend(page);

server.prepend('Show', function (req, res, next) {
    const CustomerMgr = require('dw/customer/CustomerMgr');
    const Transaction = require('dw/system/Transaction');
    const session = req.session.raw;
    const groupName = req.querystring.src;
    
    if (groupName && session.customer.authenticated) {
        let customer = CustomerMgr.getCustomerByCustomerNumber(session.customer.profile.customerNo);
        let customerGroup = CustomerMgr.getCustomerGroup(groupName);
        
        if (customer && customerGroup && !customer.isMemberOfCustomerGroup(groupName)) {
            Transaction.wrap(function () {
                customerGroup.assignCustomer(customer);
                customer = CustomerMgr.getCustomerByCustomerNumber(session.customer.profile.customerNo);
            });
            
            req.session.privacyCache.set('promotionActivated_' + groupName, true);
        }
    }
    
    next();
});

module.exports = server.exports();