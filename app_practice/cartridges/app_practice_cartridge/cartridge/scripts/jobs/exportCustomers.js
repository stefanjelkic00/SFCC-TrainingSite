/**
 * Customer Export Job - Exports non-exported customers and tracks subscription changes
 * Path: app_practice_cartridge/cartridge/scripts/jobs/exportCustomers.js
 */
'use strict';

const Logger = require('dw/system/Logger');
const Status = require('dw/system/Status');
const CustomerMgr = require('dw/customer/CustomerMgr');
const File = require('dw/io/File');
const FileWriter = require('dw/io/FileWriter');
const XMLStreamWriter = require('dw/io/XMLStreamWriter');
const Transaction = require('dw/system/Transaction');
const FileSystemHelper = require('~/cartridge/scripts/helpers/fileSystemHelpers');

const exportLogger = Logger.getLogger('CustomerExport', 'CustomerExport');

function execute(parameters, stepExecution) {
    try {
        exportLogger.info('Customer export started');
        
        const impexPath = parameters.ImpexPath || 'customers';
        const fileName = parameters.FileName || 'customer_export';
        
        const exportDirectory = FileSystemHelper.ensureImpexPath(impexPath);
        if (!exportDirectory) {
            throw new Error(`Failed to create export directory: ${impexPath}`);
        }
        
        const customersFound = getCustomersCount();
        
        if (customersFound === 0) {
            exportLogger.info('No customers found for export');
            return new Status(Status.OK, 'NO_EXPORT_NEEDED', 'No customers require export');
        }
        
        // Add timestamp to filename according to company standard
        const timestamp = new Date().getTime();
        const fullFileName = `${fileName}_${timestamp}.xml`;
        const xmlFilePath = `${exportDirectory.getFullPath()}${File.SEPARATOR}${fullFileName}`;
        
        const exportedCount = exportCustomersStreaming(xmlFilePath);
        
        exportLogger.info(`Export completed: ${exportedCount} customers exported`);
        return new Status(Status.OK, 'EXPORT_SUCCESS', 
            `Successfully exported ${exportedCount} customers to ${fullFileName}`);
        
    } catch (error) {
        exportLogger.error(`Customer export failed: ${error.message}`);
        return new Status(Status.ERROR, 'EXPORT_FAILED', error.message);
    }
}

function getCustomersCount() {
    let customerIterator = null;
    let count = 0;
    
    try {
        const query = 'custom.isExported != {0} OR custom.isExported = {1}';
        customerIterator = CustomerMgr.searchProfiles(query, 'lastModified asc', [true, null]);
        
        while (customerIterator.hasNext() && count < 10000) {
            customerIterator.next();
            count++;
        }
        
    } finally {
        if (customerIterator) {
            customerIterator.close();
        }
    }
    
    return count;
}

function exportCustomersStreaming(xmlFilePath) {
    let file = null;
    let fileWriter = null;
    let xmlWriter = null;
    let customerIterator = null;
    let exportedCount = 0;
    
    try {
        // Setup XML writer
        file = new File(xmlFilePath);
        fileWriter = new FileWriter(file, 'UTF-8');
        xmlWriter = new XMLStreamWriter(fileWriter);
        
        xmlWriter.writeStartDocument('UTF-8', '1.0');
        xmlWriter.writeStartElement('customers');
        
        // ADD TIMESTAMP ATTRIBUTE TO ROOT ELEMENT
        const exportTimestamp = new Date();
        xmlWriter.writeAttribute('exportTimestamp', exportTimestamp.toISOString());
        
        // Setup customer iterator
        const query = 'custom.isExported != {0} OR custom.isExported = {1}';
        customerIterator = CustomerMgr.searchProfiles(query, 'lastModified asc', [true, null]);
        
        let count = 0;
        while (customerIterator.hasNext() && count < 10000) {
            const profile = customerIterator.next();
            count++;
            
            const customerData = extractCustomerData(profile);
            
            // Write to XML
            xmlWriter.writeStartElement('customer');
            xmlWriter.writeAttribute('no', customerData.customerNo);
            
            writeCustomerXML(xmlWriter, customerData);
            xmlWriter.writeEndElement(); // customer
            
            // Mark as exported immediately
            markSingleCustomerAsExported(profile);
            
            exportedCount++;
        }
        
        xmlWriter.writeEndElement(); // customers
        xmlWriter.writeEndDocument();
        
        return exportedCount;
        
    } catch (error) {
        exportLogger.error(`Error during streaming export: ${error.message}`);
        throw error;
    } finally {
        if (customerIterator) {
            customerIterator.close();
        }
        if (xmlWriter) {
            xmlWriter.close();
        }
        if (fileWriter) {
            fileWriter.close();
        }
    }
}

function extractCustomerData(profile) {
    return {
        customerNo: profile.customerNo,
        email: profile.email,
        firstName: profile.firstName,
        lastName: profile.lastName,
        newsletterSubscribed: profile.custom.newsletterSubscribed || false,
        newsletterEmail: profile.custom.newsletterEmail || profile.email,
        isExported: profile.custom.isExported || false
    };
}

function markSingleCustomerAsExported(profile) {
    try {
        Transaction.wrap(() => {
            profile.custom.isExported = true;
        });
    } catch (error) {
        exportLogger.error(`Error marking customer ${profile.customerNo}: ${error.message}`);
    }
}

function writeCustomerXML(xmlWriter, customerData) {
    const fields = {
        'firstname': customerData.firstName,
        'lastname': customerData.lastName,
        'email': customerData.email,
        'newsletter-subscribed': customerData.newsletterSubscribed.toString(),
        'newsletter-email': customerData.newsletterEmail
    };
    
    Object.entries(fields).forEach(([tag, value]) => {
        if (value) {
            writeXMLElement(xmlWriter, tag, value);
        }
    });
}

function writeXMLElement(xmlWriter, elementName, value) {
    xmlWriter.writeStartElement(elementName);
    if (value !== null && value !== undefined && value !== '') {
        xmlWriter.writeCharacters(value.toString());
    }
    xmlWriter.writeEndElement();
}

exports.execute = execute;