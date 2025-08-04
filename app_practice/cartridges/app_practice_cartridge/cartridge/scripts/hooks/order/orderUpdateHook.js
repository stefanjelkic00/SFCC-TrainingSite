'use strict';

const Status = require('dw/system/Status');
const Transaction = require('dw/system/Transaction');

exports.afterPATCH = function(order, orderInput) {
    Transaction.wrap(function() {
        for (let i = 0; i < orderInput.shipments.length; i++) {
            for (let j = 0; j < order.shipments.length; j++) {
                if (orderInput.shipments[i].shipment_id === order.shipments[j].ID && 
                    orderInput.shipments[i].c_trackingNumber) {
                    order.shipments[j].custom.trackingNumber = orderInput.shipments[i].c_trackingNumber;
                }
            }
        }
    });
    
    return new Status(Status.OK);
};