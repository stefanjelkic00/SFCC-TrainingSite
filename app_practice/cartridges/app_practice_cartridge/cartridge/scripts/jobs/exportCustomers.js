'use strict';

const Logger = require('dw/system/Logger');
const Status = require('dw/system/Status');
const CustomerMgr = require('dw/customer/CustomerMgr');
const File = require('dw/io/File');
const FileWriter = require('dw/io/FileWriter');
const XMLStreamWriter = require('dw/io/XMLStreamWriter');
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
    const file = new File(xmlFilePath);
    const fileWriter = new FileWriter(file, 'UTF-8');
    const xmlWriter = new XMLStreamWriter(fileWriter);
    const query = 'custom.isExported != {0} OR custom.isExported = {1}';
    const customerIterator = CustomerMgr.searchProfiles(query, 'lastModified asc', [true, null]);
    let count = 0;
    let exportedCount = 0;
    
    xmlWriter.writeStartDocument('UTF-8', '1.0');
    xmlWriter.writeStartElement('customers');
    
    while (customerIterator.hasNext()) {
        const profile = customerIterator.next();
        
        xmlWriter.writeStartElement('customer');
        xmlWriter.writeAttribute('no', profile.customerNo);
        writeCustomerXML(xmlWriter, profile);
        xmlWriter.writeEndElement();
        
        Transaction.wrap(function() { 
            profile.custom.isExported = true; 
        });
        count++;
        exportedCount++;
    }
    
    xmlWriter.writeEndElement();
    xmlWriter.writeEndDocument();
    
    customerIterator && customerIterator.close();
    xmlWriter && xmlWriter.close();
    fileWriter && fileWriter.close();
    
    return exportedCount;
}

function extractCustomerAddresses(profile) {
    const customerAddresses = profile.getAddressBook().getAddresses();
    const addresses = [];
    
    for (let i = 0; i < customerAddresses.length; i++) {
        const addr = customerAddresses[i];
        addresses.push({
            id: addr.getID(),
            address1: addr.getAddress1() || '',
            address2: addr.getAddress2() || '',
            city: addr.getCity() || '',
            houseNr: addr.custom.houseNr || ''
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
    
    for (let i = 0; i < fields.length; i++) {
        const [fieldName, value] = fields[i];
        value && writeXMLElement(xmlWriter, fieldName, value);
    }
    
    const addresses = extractCustomerAddresses(profile);
    if (addresses && addresses.length > 0) {
        xmlWriter.writeStartElement('addresses');
        
        for (let i = 0; i < addresses.length; i++) {
            const address = addresses[i];
            xmlWriter.writeStartElement('address');
            xmlWriter.writeAttribute('id', address.id);
            
            writeXMLElement(xmlWriter, 'address1', address.address1);
            writeXMLElement(xmlWriter, 'address2', address.address2);
            writeXMLElement(xmlWriter, 'city', address.city);
            writeXMLElement(xmlWriter, 'house-nr', address.houseNr);
            
            xmlWriter.writeEndElement();
        }
        
        xmlWriter.writeEndElement();
    }
}

function writeXMLElement(xmlWriter, elementName, value) {
    xmlWriter.writeStartElement(elementName);
    value && xmlWriter.writeCharacters(value.toString());
    xmlWriter.writeEndElement();
}

exports.execute = execute;