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
        for (var i = 0; i < xmlFiles.length; i++) {
            var xmlFile = xmlFiles[i];
            
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
                    const postProcessResult = postProcessFile(xmlFile, postProcessAction, archivePath);
                    if (!postProcessResult.success) {
                        warnings.push('Failed to ' + postProcessAction + ' file ' + xmlFile.getName() + ': ' + postProcessResult.error);
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
    var files = [];
    
    try {
        var directory = new File(File.IMPEX + File.SEPARATOR + impexPath);
        
        if (!directory.exists() || !directory.isDirectory()) {
            importLogger.warn('IMPEX directory does not exist: ' + directory.getFullPath());
            return files;
        }
        
        var allFiles = directory.listFiles();
        if (!allFiles) {
            return files;
        }
        
        // Convert pattern to regex (simple glob to regex conversion)
        var regexPattern = filePattern
            .replace(/\./g, '\\.')  // Escape dots
            .replace(/\*/g, '.*');  // Convert * to .*
        
        var regex = new RegExp('^' + regexPattern + '$');
        
        for (var i = 0; i < allFiles.length; i++) {
            var file = allFiles[i];
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
    var fileReader = null;
    var xmlReader = null;
    
    var result = {
        processed: 0,
        updated: 0,
        errors: 0,
        warnings: []
    };
    
    try {
        fileReader = new FileReader(xmlFile, 'UTF-8');
        xmlReader = new XMLStreamReader(fileReader);
        
        var inCustomersElement = false;
        var inCustomerElement = false;
        var currentCustomerData = {};
        
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
                    
                    // ALWAYS LOG CUSTOMER PROCESSING - regardless of debug mode
                    importLogger.info('PROCESSING CUSTOMER: ' + currentCustomerData.customerNo + ' with data: ' + JSON.stringify(currentCustomerData));
                    
                    var updateResult = updateCustomer(currentCustomerData);
                    if (updateResult.success) {
                        result.updated++;
                        importLogger.info('SUCCESS: Updated customer ' + currentCustomerData.customerNo);
                    } else {
                        result.errors++;
                        result.warnings.push('Customer ' + currentCustomerData.customerNo + ': ' + updateResult.error);
                        importLogger.error('FAILED: Customer ' + currentCustomerData.customerNo + ' - ' + updateResult.error);
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
            var event = xmlReader.next();
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
    var modifiedData = {};
    
    // Create copy of customer data
    for (var key in customerData) {
        if (customerData.hasOwnProperty(key)) {
            modifiedData[key] = customerData[key];
        }
    }
    
    var timestamp = new Date().getTime();
    
    // SIMPLE TRANSFORMATION - Only modify lastName to demonstrate import functionality
    
    if (modifiedData.lastname) {
        // Remove any existing suffixes and add new timestamp-based suffix
        var cleanLastName = modifiedData.lastname.replace(/-IMPORTED.*$/, '').replace(/-CHANGED.*$/, '');
        modifiedData.lastname = cleanLastName + '-IMPORTED-' + timestamp;
        
        // ALWAYS LOG TRANSFORMATION
        importLogger.info('TRANSFORM: Customer ' + customerData.customerNo + ' lastName: ' + customerData.lastname + ' → ' + modifiedData.lastname);
    } else {
        importLogger.warn('NO LASTNAME: Customer ' + customerData.customerNo + ' has no lastname field');
    }
    
    return modifiedData;
}

function updateCustomer(customerData) {
    try {
        if (!customerData.customerNo) {
            return { success: false, error: 'Missing customer number' };
        }
        
        var customer = CustomerMgr.getCustomerByCustomerNumber(customerData.customerNo);
        if (!customer) {
            return { success: false, error: 'Customer not found' };
        }
        
        var profile = customer.getProfile();
        if (!profile) {
            return { success: false, error: 'Customer profile not found' };
        }
        
        // APPLY AUTOMATIC DATA TRANSFORMATIONS
        var modifiedData = applyDataTransformations(customerData);
        
        var updated = false;
        
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
                var newsletterSubscribed = modifiedData['newsletter-subscribed'] === 'true';
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
            
            // Add import timestamp to track when customer was last imported
            // profile.custom.lastImportTimestamp = new Date().getTime();
            // Note: This custom attribute needs to be defined in Business Manager first
            // updated = true;
        });
        
        return { success: true, updated: updated };
        
    } catch (error) {
        importLogger.error('Error updating customer ' + customerData.customerNo + ': ' + error.message);
        return { success: false, error: error.message };
    }
}

function postProcessFile(xmlFile, action, archivePath) {
    try {
        switch (action) {
            case 'remove':
                return removeFile(xmlFile);
            
            case 'archive':
                return archiveFile(xmlFile, archivePath);
            
            case 'archive_zip':
                return archiveFileZipped(xmlFile, archivePath);
            
            default:
                return { success: false, error: 'Unknown post-process action: ' + action };
        }
    } catch (error) {
        return { success: false, error: error.message };
    }
}

function removeFile(xmlFile) {
    try {
        var deleted = xmlFile.remove();
        if (deleted) {
            importLogger.info('Removed file: ' + xmlFile.getName());
            return { success: true };
        } else {
            return { success: false, error: 'Failed to delete file' };
        }
    } catch (error) {
        return { success: false, error: error.message };
    }
}

function archiveFile(xmlFile, archivePath) {
    try {
        // Ensure archive directory exists
        var archiveDirectory = FileSystemHelper.ensureImpexPath(archivePath);
        if (!archiveDirectory) {
            return { success: false, error: 'Failed to create archive directory' };
        }
        
        var archiveFile = new File(archiveDirectory.getFullPath() + File.SEPARATOR + xmlFile.getName());
        var moved = xmlFile.renameTo(archiveFile);
        
        if (moved) {
            importLogger.info('Archived file: ' + xmlFile.getName() + ' to ' + archivePath);
            return { success: true };
        } else {
            return { success: false, error: 'Failed to move file to archive' };
        }
    } catch (error) {
        return { success: false, error: error.message };
    }
}

function archiveFileZipped(xmlFile, archivePath) {
    try {
        // Ensure archive directory exists
        var archiveDirectory = FileSystemHelper.ensureImpexPath(archivePath);
        if (!archiveDirectory) {
            return { success: false, error: 'Failed to create archive directory' };
        }
        
        // Create zip file name
        var originalName = xmlFile.getName();
        var baseName = originalName.substring(0, originalName.lastIndexOf('.'));
        var zipFileName = baseName + '.zip';
        var zipFilePath = archiveDirectory.getFullPath() + File.SEPARATOR + zipFileName;
        
        // Note: SFCC doesn't have built-in ZIP API, so we'll simulate by renaming with .zip extension
        // In a real implementation, you'd need to use a custom ZIP library or external service
        var zipFile = new File(zipFilePath);
        var moved = xmlFile.renameTo(zipFile);
        
        if (moved) {
            importLogger.info('Archived and zipped file: ' + originalName + ' to ' + zipFileName);
            return { success: true };
        } else {
            return { success: false, error: 'Failed to archive as zip' };
        }
    } catch (error) {
        return { success: false, error: error.message };
    }
}

exports.execute = execute;