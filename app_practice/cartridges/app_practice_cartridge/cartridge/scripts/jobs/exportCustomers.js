'use strict';

const Logger = require('dw/system/Logger');
const Status = require('dw/system/Status');
const CustomerMgr = require('dw/customer/CustomerMgr');
const File = require('dw/io/File');
const Transaction = require('dw/system/Transaction');
const FileSystemHelper = require('~/cartridge/scripts/helpers/fileSystemHelpers');

function execute(parameters, stepExecution) {
    const impexPath = parameters.ImpexPath || 'customers';
    const fileNamePattern = parameters.FileName || 'customer_export_{TIMESTAMP}.xml';
    const exportDirectory = FileSystemHelper.ensureImpexPath(impexPath);
    
    if (!exportDirectory) return new Status(Status.ERROR, 'EXPORT_FAILED', 'Failed to create export directory: ' + impexPath);
    
    const timestamp = new Date().getTime();
    const fullFileName = fileNamePattern.replace('{TIMESTAMP}', timestamp);
    const xmlFilePath = exportDirectory.getFullPath() + File.SEPARATOR + fullFileName;
    const exportedCount = exportCustomersStreaming(xmlFilePath);
    
    if (exportedCount === 0) return new Status(Status.OK, 'NO_EXPORT_NEEDED', 'No customers require export');
    
    return new Status(Status.OK, 'EXPORT_SUCCESS', 'Successfully exported ' + exportedCount + ' customers to ' + fullFileName);
}

function exportCustomersStreaming(xmlFilePath) {
    const { xmlWriter, fileWriter } = FileSystemHelper.createXMLWriter(xmlFilePath);
    const customerIterator = CustomerMgr.searchProfiles('custom.isExported != {0} OR custom.isExported = {1}', 'lastModified asc', [true, null]);
    let exportedCount = 0;
    
    xmlWriter.writeStartDocument('UTF-8', '1.0');
    xmlWriter.writeStartElement('customers');
    
    while (customerIterator.hasNext()) {
        const profile = customerIterator.next();
        xmlWriter.writeStartElement('customer');
        xmlWriter.writeAttribute('no', profile.customerNo);
        writeCustomerXML(xmlWriter, profile);
        xmlWriter.writeEndElement();
        Transaction.wrap(function() { profile.custom.isExported = true; });
        exportedCount++;
    }
    
    xmlWriter.writeEndElement();
    xmlWriter.writeEndDocument();
    customerIterator && customerIterator.close();
    FileSystemHelper.closeXMLWriter(xmlWriter, fileWriter);
    
    return exportedCount;
}

function extractCustomerAddresses(profile) {
    const addresses = [];
    const customerAddresses = profile.getAddressBook().getAddresses();
    
    for (let i = 0; i < customerAddresses.length; i++) {
        addresses.push({
            id: customerAddresses[i].getID(),
            address1: customerAddresses[i].getAddress1() || '',
            address2: customerAddresses[i].getAddress2() || '',
            city: customerAddresses[i].getCity() || '',
            houseNr: customerAddresses[i].custom.houseNr || ''
        });
    }
    
    return addresses;
}

function writeCustomerXML(xmlWriter, profile) {
    const fields = [
        ['firstname', profile.firstName],
        ['lastname', profile.lastName], 
        ['email', profile.email],
        ['newsletter-subscribed', (profile.custom.newsletterSubscribed || false).toString()],
        ['newsletter-email', profile.custom.newsletterEmail || profile.email]
    ];
    
    fields.forEach(function(field) {
        const fieldName = field[0];
        const value = field[1];
        value && FileSystemHelper.writeXMLElement(xmlWriter, fieldName, value);
    });
    
    const addresses = extractCustomerAddresses(profile);
    if (addresses && addresses.length > 0) {
        xmlWriter.writeStartElement('addresses');
        
        addresses.forEach(function(address) {
            xmlWriter.writeStartElement('address');
            xmlWriter.writeAttribute('id', address.id);
            
            const addressFields = [
                ['address1', address.address1],
                ['address2', address.address2], 
                ['city', address.city],
                ['house-nr', address.houseNr]
            ];
            addressFields.forEach(function(addressField) {
                const field = addressField[0];
                const value = addressField[1];
                FileSystemHelper.writeXMLElement(xmlWriter, field, value);
            });
            xmlWriter.writeEndElement();
        });
        
        xmlWriter.writeEndElement();
    }
}

exports.execute = execute;