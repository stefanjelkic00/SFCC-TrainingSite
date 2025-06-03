/**
 * Customer Import Job - Imports customers from XML files and updates customer data
 * Path: app_practice_cartridge/cartridge/scripts/jobs/importCustomers.js
 */
'use strict';

const Logger = require('dw/system/Logger');
const Status = require('dw/system/Status');
const CustomerMgr = require('dw/customer/CustomerMgr');
const File = require('dw/io/File');
const FileReader = require('dw/io/FileReader');
const XMLStreamReader = require('dw/io/XMLStreamReader');
const Transaction = require('dw/system/Transaction');
const FileSystemHelper = require('~/cartridge/scripts/helpers/impexHelpers');

const importLogger = Logger.getLogger('CustomerImport', 'CustomerImport');

function execute(parameters, stepExecution) {
    try {
        importLogger.info('Customer import started');
        
        const impexPath = parameters.ImpexPath || 'src/export/customers';
        const filePattern = parameters.FilePattern || 'customer_export_*.xml';
        const postProcessAction = parameters.PostProcessAction || 'archive';
        const archivePath = parameters.ArchivePath || 'src/archive/customers';
        
        // Find XML files matching pattern
        const xmlFiles = findXMLFiles(impexPath, filePattern);
        
        if (xmlFiles.length === 0) {
            importLogger.info('No XML files found matching pattern: ' + filePattern);
            return new Status(Status.OK, 'NO_FILES_FOUND', 'No XML files found for import');
        }
        
        let totalProcessed = 0;
        let totalUpdated = 0;
        let totalErrors = 0;
        let warnings = [];
        
        // Process each XML file
        for (let i = 0; i < xmlFiles.length; i++) {
            const xmlFile = xmlFiles[i];
            
            try {
                importLogger.info('Processing file ' + (i + 1) + '/' + xmlFiles.length + ': ' + xmlFile.getName());
                
                const result = processXMLFile(xmlFile);
                totalProcessed += result.processed;
                totalUpdated += result.updated;
                totalErrors += result.errors;
                
                if (result.warnings.length > 0) {
                    warnings = warnings.concat(result.warnings);
                }
                
                // Post-process file after successful processing
                if (result.processed > 0) {
                    try {
                        postProcessFile(xmlFile, postProcessAction, archivePath);
                    } catch (error) {
                        warnings.push('Failed to ' + postProcessAction + ' file ' + xmlFile.getName() + ': ' + error.message);
                    }
                }
                
            } catch (error) {
                importLogger.error('Error processing file ' + xmlFile.getName() + ': ' + error.message);
                totalErrors++;
                warnings.push('Failed to process file ' + xmlFile.getName() + ': ' + error.message);
            }
        }
        
        const message = 'Processed ' + xmlFiles.length + ' files, updated ' + totalUpdated + ' customers, ' + totalErrors + ' errors';
        importLogger.info('Import completed: ' + message);
        
        if (totalErrors > 0 || warnings.length > 0) {
            return new Status(Status.ERROR, 'IMPORT_WITH_WARNINGS', 
                message + '. Warnings: ' + warnings.join('; '));
        }
        
        return new Status(Status.OK, 'IMPORT_SUCCESS', message);
        
    } catch (error) {
        importLogger.error('Customer import failed: ' + error.message);
        return new Status(Status.ERROR, 'IMPORT_FAILED', error.message);
    }
}

function findXMLFiles(impexPath, filePattern) {
    const files = [];
    
    try {
        const directory = new File(File.IMPEX + File.SEPARATOR + impexPath);
        
        if (!directory.exists() || !directory.isDirectory()) {
            importLogger.warn('IMPEX directory does not exist: ' + directory.getFullPath());
            return files;
        }
        
        const allFiles = directory.listFiles();
        if (!allFiles) {
            return files;
        }
        
        // Convert pattern to regex (simple glob to regex conversion)
        const regexPattern = filePattern
            .replace(/\./g, '\\.')  // Escape dots
            .replace(/\*/g, '.*');  // Convert * to .*
        
        const regex = new RegExp('^' + regexPattern + '$');
        
        for (let i = 0; i < allFiles.length; i++) {
            const file = allFiles[i];
            if (file.isFile() && regex.test(file.getName())) {
                files.push(file);
                importLogger.info('Found matching file: ' + file.getName());
            }
        }
        
    } catch (error) {
        importLogger.error('Error finding XML files: ' + error.message);
    }
    
    return files;
}

function processXMLFile(xmlFile) {
    let fileReader = null;
    let xmlReader = null;
    
    const result = {
        processed: 0,
        updated: 0,
        errors: 0,
        warnings: []
    };
    
    try {
        fileReader = new FileReader(xmlFile, 'UTF-8');
        xmlReader = new XMLStreamReader(fileReader);
        
        let inCustomersElement = false;
        let inCustomerElement = false;
        let currentCustomerData = {};
        
        while (xmlReader.hasNext()) {
            var event = xmlReader.next();
            
            if (event === 1) {  // START_ELEMENT = 1
                var elementName = xmlReader.getLocalName();
                
                if (elementName === 'customers') {
                    inCustomersElement = true;
                } else if (elementName === 'customer' && inCustomersElement) {
                    inCustomerElement = true;
                    currentCustomerData = {
                        customerNo: xmlReader.getAttributeValue(null, 'no')
                    };
                } else if (inCustomerElement) {
                    // Read customer data elements
                    var elementValue = readElementText(xmlReader);
                    currentCustomerData[elementName] = elementValue;
                }
                
            } else if (event === 2) {  // END_ELEMENT = 2
                var elementName = xmlReader.getLocalName();
                
                if (elementName === 'customer' && inCustomerElement) {
                    // Process complete customer data
                    result.processed++;
                    
                    try {
                        var updated = updateCustomer(currentCustomerData);
                        if (updated) {
                            result.updated++;
                        }
                    } catch (error) {
                        result.errors++;
                        result.warnings.push('Customer ' + currentCustomerData.customerNo + ': ' + error.message);
                        importLogger.error('FAILED: Customer ' + currentCustomerData.customerNo + ' - ' + error.message);
                    }
                    
                    inCustomerElement = false;
                    currentCustomerData = {};
                    
                } else if (elementName === 'customers') {
                    inCustomersElement = false;
                }
            }
        }
        
    } catch (error) {
        importLogger.error('Error parsing XML file ' + xmlFile.getName() + ': ' + error.message);
        result.errors++;
        result.warnings.push('XML parsing error: ' + error.message);
    } finally {
        if (xmlReader) {
            xmlReader.close();
        }
        if (fileReader) {
            fileReader.close();
        }
    }
    
    return result;
}

function readElementText(xmlReader) {
    try {
        if (xmlReader.hasNext()) {
            const event = xmlReader.next();
            if (event === 4) {  // CHARACTERS = 4
                return xmlReader.getText();
            }
        }
    } catch (error) {
        importLogger.warn('Error reading element text: ' + error.message);
    }
    return '';
}

function applyDataTransformations(customerData) {
    const modifiedData = {};
    
    // Create copy of customer data
    for (var key in customerData) {
        if (customerData.hasOwnProperty(key)) {
            modifiedData[key] = customerData[key];
        }
    }
    
    const timestamp = new Date().getTime();
    
    // SIMPLE TRANSFORMATION - Only modify lastName to demonstrate import functionality
    if (modifiedData.lastname) {
        // Remove any existing suffixes and add new timestamp-based suffix
        const cleanLastName = modifiedData.lastname.replace(/-IMPORTED.*$/, '').replace(/-CHANGED.*$/, '');
        modifiedData.lastname = cleanLastName + '-IMPORTED-' + timestamp;
    } else {
        importLogger.warn('NO LASTNAME: Customer ' + customerData.customerNo + ' has no lastname field');
    }
    
    return modifiedData;
}

function updateCustomer(customerData) {
    if (!customerData.customerNo) {
        throw new Error('Missing customer number');
    }
    
    const customer = CustomerMgr.getCustomerByCustomerNumber(customerData.customerNo);
    if (!customer) {
        throw new Error('Customer not found');
    }
    
    const profile = customer.getProfile();
    if (!profile) {
        throw new Error('Customer profile not found');
    }
    
    // APPLY AUTOMATIC DATA TRANSFORMATIONS
    const modifiedData = applyDataTransformations(customerData);
    
    let updated = false;
    
    Transaction.wrap(function() {
        // Update basic profile data with modified values
        if (modifiedData.firstname && profile.firstName !== modifiedData.firstname) {
            profile.firstName = modifiedData.firstname;
            updated = true;
        }
        
        if (modifiedData.lastname && profile.lastName !== modifiedData.lastname) {
            importLogger.info('BEFORE UPDATE: customer ' + customerData.customerNo + ' profile.lastName = "' + profile.lastName + '"');
            profile.lastName = modifiedData.lastname;
            importLogger.info('AFTER UPDATE: customer ' + customerData.customerNo + ' profile.lastName = "' + profile.lastName + '"');
            updated = true;
        } else {
            importLogger.warn('LASTNAME NOT UPDATED: customer ' + customerData.customerNo + ' - modifiedData.lastname="' + modifiedData.lastname + '", profile.lastName="' + profile.lastName + '"');
        }
        
        if (modifiedData.email && profile.email !== modifiedData.email) {
            profile.email = modifiedData.email;
            updated = true;
        }
        
        // Update custom attributes
        if (modifiedData['newsletter-subscribed']) {
            const newsletterSubscribed = modifiedData['newsletter-subscribed'] === 'true';
            if (profile.custom.newsletterSubscribed !== newsletterSubscribed) {
                profile.custom.newsletterSubscribed = newsletterSubscribed;
                // Reset export flag when subscription changes (as per Task 5 requirement)
                profile.custom.isExported = false;
                updated = true;
            }
        }
        
        if (modifiedData['newsletter-email'] && profile.custom.newsletterEmail !== modifiedData['newsletter-email']) {
            profile.custom.newsletterEmail = modifiedData['newsletter-email'];
            updated = true;
        }
    });
    
    return updated;
}

function postProcessFile(xmlFile, action, archivePath) {
    switch (action) {
        case 'remove':
            removeFile(xmlFile);
            break;
        
        case 'archive':
            archiveFile(xmlFile, archivePath);
            break;
        
        case 'archive_zip':
            archiveFileZipped(xmlFile, archivePath);
            break;
        
        default:
            throw new Error('Unknown post-process action: ' + action);
    }
}

function removeFile(xmlFile) {
    const deleted = xmlFile.remove();
    if (!deleted) {
        throw new Error('Failed to delete file');
    }
}

function archiveFile(xmlFile, archivePath) {
    // Ensure archive directory exists
    const archiveDirectory = FileSystemHelper.ensureImpexPath(archivePath);
    if (!archiveDirectory) {
        throw new Error('Failed to create archive directory');
    }
    
    const archiveFile = new File(archiveDirectory.getFullPath() + File.SEPARATOR + xmlFile.getName());
    const moved = xmlFile.renameTo(archiveFile);
    
    if (!moved) {
        throw new Error('Failed to move file to archive');
    }
}

function archiveFileZipped(xmlFile, archivePath) {
    // Ensure archive directory exists
    const archiveDirectory = FileSystemHelper.ensureImpexPath(archivePath);
    if (!archiveDirectory) {
        throw new Error('Failed to create archive directory');
    }
    
    // Create zip file name
    const originalName = xmlFile.getName();
    const baseName = originalName.substring(0, originalName.lastIndexOf('.'));
    const zipFileName = baseName + '.zip';
    const zipFilePath = archiveDirectory.getFullPath() + File.SEPARATOR + zipFileName;
    
    // Note: SFCC doesn't have built-in ZIP API, so we'll simulate by renaming with .zip extension
    // In a real implementation, you'd need to use a custom ZIP library or external service
    const zipFile = new File(zipFilePath);
    const moved = xmlFile.renameTo(zipFile);
    
    if (!moved) {
        throw new Error('Failed to archive as zip');
    }
}

exports.execute = execute;