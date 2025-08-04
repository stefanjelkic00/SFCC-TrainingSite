'use strict';

const Status = require('dw/system/Status');
const Transaction = require('dw/system/Transaction');

exports.afterPATCH = function(order, orderInput) {
    Transaction.wrap(function() {
        for (let i = 0; i < orderInput.shipments.length; i++) {
            if (orderInput.shipments[i].c_trackingNumber) {
                let shipment = order.getShipment(orderInput.shipments[i].shipment_id);
                if (shipment) {
                    shipment.custom.trackingNumber = orderInput.shipments[i].c_trackingNumber;
                }
            }
        }
    });
    
    return new Status(Status.OK);
};
