'use strict';

const Status = require('dw/system/Status');
const Transaction = require('dw/system/Transaction');

exports.afterPATCH = function(order, orderInput) {
    Transaction.wrap(function() {
        for (let i = 0; i < orderInput.shipments.length; i++) {
            if (orderInput.shipments[i].c_trackingNumber) {
                let shipment = order.getShipment(orderInput.shipments[i].shipment_id);
                shipment.custom.trackingNumber = orderInput.shipments[i].c_trackingNumber;
            }
        }
    });
    
    return new Status(Status.OK);
};
// getShipmentNo() : String

// Returns the shipment number for this shipment.  jel mozda ovo ?  getID() : String

// Returns the ID of this shipment ("me" for the default shipment). ili ovo ? 