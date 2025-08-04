'use strict';

const Status = require('dw/system/Status');
const Transaction = require('dw/system/Transaction');

exports.afterPATCH = function(order, orderInput) {
    Transaction.wrap(function() {
        order.shipments[0].custom.trackingNumber = orderInput.shipments[0].c_trackingNumber;
    });
    
    return new Status(Status.OK);
};