
'use strict';

const Status = require('dw/system/Status');
const CustomerMgr = require('dw/customer/CustomerMgr');
const File = require('dw/io/File');
const Transaction = require('dw/system/Transaction');
const FileSystemHelper = require('~/cartridge/scripts/helpers/fileSystemHelpers');

function execute(parameters, stepExecution) {
    const impexPath = parameters.ImpexPath || 'customers';
    const fileNamePattern = parameters.FileName || 'customer_export_{TIMESTAMP}.xml';
    const exportDirectory = FileSystemHelper.ensureImpexPath(impexPath);
    
    if (!exportDirectory) {
        return new Status(Status.ERROR, 'EXPORT_FAILED', 'Failed to create export directory: ' + impexPath);
    }
    
    const timestamp = new Date().getTime();
    const fullFileName = fileNamePattern.replace('{TIMESTAMP}', timestamp);
    const xmlFilePath = exportDirectory.getFullPath() + File.SEPARATOR + fullFileName;
    const exportedCount = exportCustomersStreaming(xmlFilePath);
    
    if (exportedCount === 0) {
        return new Status(Status.OK, 'NO_EXPORT_NEEDED', 'No customers require export');
    }
    
    return new Status(Status.OK, 'EXPORT_SUCCESS', 'Successfully exported ' + exportedCount + ' customers to ' + fullFileName);
}

function exportCustomersStreaming(xmlFilePath) {
    const result = FileSystemHelper.getWritters(xmlFilePath);
    const xmlWriter = result.xmlWriter;
    const fileWriter = result.fileWriter;
    const customerIterator = CustomerMgr.searchProfiles('custom.isExported != {0}', 'lastModified asc', [true]);
    let exportedCount = 0;
    
    xmlWriter.writeStartDocument('UTF-8', '1.0');
    xmlWriter.writeStartElement('customers');
    
    while (customerIterator.hasNext()) {
        let profile = customerIterator.next();
        
        xmlWriter.writeStartElement('customer');
        xmlWriter.writeAttribute('no', profile.customerNo);
        writeCustomerXML(xmlWriter, profile);
        xmlWriter.writeEndElement();
        
        Transaction.wrap(function() {
            profile.custom.isExported = true;
        });
        
        exportedCount++;
    }
    
    xmlWriter.writeEndElement();
    xmlWriter.writeEndDocument();
    
    if (customerIterator) {
        customerIterator.close();
    }
    
    FileSystemHelper.closeXMLWriter(xmlWriter, fileWriter);
    
    return exportedCount;
}

function writeCustomerXML(xmlWriter, profile) {
    if (profile.firstName) {
        FileSystemHelper.writeXMLElement(xmlWriter, 'firstname', profile.firstName);
    }
    
    if (profile.lastName) {
        FileSystemHelper.writeXMLElement(xmlWriter, 'lastname', profile.lastName);
    }
    
    if (profile.email) {
        FileSystemHelper.writeXMLElement(xmlWriter, 'email', profile.email);
    }
    
    FileSystemHelper.writeXMLElement(xmlWriter, 'newsletter-subscribed', (profile.custom.newsletterSubscribed || false).toString());
    FileSystemHelper.writeXMLElement(xmlWriter, 'newsletter-email', profile.custom.newsletterEmail || profile.email);
    
    let addressBook = profile.getAddressBook();
    let addresses = addressBook.getAddresses();
    
    if (addresses && addresses.length > 0) {
        xmlWriter.writeStartElement('addresses');
        
        for (let i = 0; i < addresses.length; i++) {
            let addr = addresses[i]; 
            writeAddressXML(xmlWriter, addr, addressBook, i);
        }
        
        xmlWriter.writeEndElement();
    }
}

function writeAddressXML(xmlWriter, addr) {
    xmlWriter.writeStartElement('address');
    xmlWriter.writeAttribute('id', addr.getID()); 
    
    FileSystemHelper.writeXMLElement(xmlWriter, 'address1', addr.getAddress1() || '');
    FileSystemHelper.writeXMLElement(xmlWriter, 'address2', addr.getAddress2() || '');
    FileSystemHelper.writeXMLElement(xmlWriter, 'city', addr.getCity() || '');
    FileSystemHelper.writeXMLElement(xmlWriter, 'postal-code', addr.getPostalCode() || '');
    FileSystemHelper.writeXMLElement(xmlWriter, 'state-code', addr.getStateCode() || '');
    FileSystemHelper.writeXMLElement(xmlWriter, 'country-code', addr.getCountryCode() || '');
    FileSystemHelper.writeXMLElement(xmlWriter, 'house-nr', addr.custom.houseNr || '');
    
    xmlWriter.writeEndElement();
}

exports.execute = execute;