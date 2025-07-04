'use strict';

const server = require('server');
const page = module.superModule;
server.extend(page);

server.prepend('Show', function (req, res, next) {
    const CustomerMgr = require('dw/customer/CustomerMgr');
    const Transaction = require('dw/system/Transaction');
    const session = req.session.raw;
    
    if (req.querystring.src === '50off' && session.customer.authenticated) {
        let customer = CustomerMgr.getCustomerByCustomerNumber(session.customer.profile.customerNo);
        let customerGroup50off = CustomerMgr.getCustomerGroup('50off');
        
        if (customer && customerGroup50off && !customer.isMemberOfCustomerGroup('50off')) {
            Transaction.wrap(function () {
                customerGroup50off.assignCustomer(customer);
                customer = CustomerMgr.getCustomerByCustomerNumber(session.customer.profile.customerNo);
            });
            
            req.session.privacyCache.set('promotionActivated', true);
        }
    }
    
    next();
});

module.exports = server.exports();