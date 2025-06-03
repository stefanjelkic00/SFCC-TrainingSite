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

const logger = Logger.getLogger('CustomerImport', 'CustomerImport');

function execute(parameters, stepExecution) {
    try {
        logger.info('Customer import started');
        
        const impexPath = parameters.ImpexPath || 'src/export/customers';
        const filePattern = parameters.FilePattern || 'customer_export_*.xml';
        const postProcessAction = parameters.PostProcessAction || 'archive';
        const archivePath = parameters.ArchivePath || 'src/archive/customers';
        
        const xmlFiles = findXMLFiles(impexPath, filePattern);
        if (xmlFiles.length === 0) {
            logger.info('No XML files found matching pattern: ' + filePattern);
            return new Status(Status.OK, 'NO_FILES_FOUND', 'No XML files found for import');
        }
        
        let totalProcessed = 0;
        let totalUpdated = 0;
        let totalErrors = 0;
        const warnings = [];
        
        for (let i = 0; i < xmlFiles.length; i++) {
            const xmlFile = xmlFiles[i];
            
            try {
                logger.info(`Processing file ${i + 1}/${xmlFiles.length}: ${xmlFile.getName()}`);
                
                const result = processXMLFile(xmlFile);
                totalProcessed += result.processed;
                totalUpdated += result.updated;
                totalErrors += result.errors;
                warnings.push(...result.warnings);
                
                if (result.processed > 0) {
                    const postResult = postProcessFile(xmlFile, postProcessAction, archivePath);
                    if (!postResult.success) {
                        warnings.push(`Failed to ${postProcessAction} file ${xmlFile.getName()}: ${postResult.error}`);
                    }
                }
                
            } catch (error) {
                logger.error(`Error processing file ${xmlFile.getName()}: ${error.message}`);
                totalErrors++;
                warnings.push(`Failed to process file ${xmlFile.getName()}: ${error.message}`);
            }
        }
        
        const message = `Processed ${xmlFiles.length} files, updated ${totalUpdated} customers, ${totalErrors} errors`;
        logger.info('Import completed: ' + message);
        
        if (totalErrors > 0 || warnings.length > 0) {
            return new Status(Status.ERROR, 'IMPORT_WITH_WARNINGS', `${message}. Warnings: ${warnings.join('; ')}`);
        }
        
        return new Status(Status.OK, 'IMPORT_SUCCESS', message);
        
    } catch (error) {
        logger.error('Customer import failed: ' + error.message);
        return new Status(Status.ERROR, 'IMPORT_FAILED', error.message);
    }
}

function findXMLFiles(impexPath, filePattern) {
    try {
        const directory = new File(File.IMPEX + File.SEPARATOR + impexPath);
        
        if (!directory.exists() || !directory.isDirectory()) {
            logger.warn('IMPEX directory does not exist: ' + directory.getFullPath());
            return [];
        }
        
        const allFiles = directory.listFiles();
        if (!allFiles) {
            return [];
        }
        
        const regex = new RegExp('^' + filePattern.replace(/\./g, '\\.').replace(/\*/g, '.*') + '$');
        
        return allFiles.filter(file => {
            if (file.isFile() && regex.test(file.getName())) {
                logger.info('Found matching file: ' + file.getName());
                return true;
            }
            return false;
        });
        
    } catch (error) {
        logger.error('Error finding XML files: ' + error.message);
        return [];
    }
}

function processXMLFile(xmlFile) {
    const result = { processed: 0, updated: 0, errors: 0, warnings: [] };
    let fileReader = null;
    let xmlReader = null;
    
    try {
        fileReader = new FileReader(xmlFile, 'UTF-8');
        xmlReader = new XMLStreamReader(fileReader);
        
        let inCustomer = false;
        let customerData = {};
        
        while (xmlReader.hasNext()) {
            const event = xmlReader.next();
            const elementName = xmlReader.getLocalName();
            
            if (event === 1) { // START_ELEMENT
                if (elementName === 'customer') {
                    inCustomer = true;
                    customerData = { customerNo: xmlReader.getAttributeValue(null, 'no') };
                } else if (inCustomer) {
                    customerData[elementName] = readElementText(xmlReader);
                }
            } else if (event === 2 && elementName === 'customer' && inCustomer) { // END_ELEMENT
                result.processed++;
                logger.info(`Processing customer: ${customerData.customerNo}`);
                
                // Process one customer at a time (streaming approach)
                if (updateCustomer(customerData)) {
                    result.updated++;
                    logger.info(`Updated customer ${customerData.customerNo}`);
                } else {
                    result.errors++;
                    result.warnings.push(`Failed to update customer ${customerData.customerNo}`);
                    logger.error(`Failed to update customer ${customerData.customerNo}`);
                }
                
                inCustomer = false;
                customerData = {};
            }
        }
        
    } catch (error) {
        logger.error(`Error parsing XML file ${xmlFile.getName()}: ${error.message}`);
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
            if (event === 4) {
                return xmlReader.getText(); // CHARACTERS
            }
        }
    } catch (error) {
        logger.warn('Error reading element text: ' + error.message);
    }
    return '';
}

function applyDataTransformations(customerData) {
    const modifiedData = { ...customerData };
    const timestamp = new Date().getTime();
    
    if (modifiedData.lastname) {
        const cleanLastName = modifiedData.lastname.replace(/-IMPORTED.*$/, '').replace(/-CHANGED.*$/, '');
        modifiedData.lastname = `${cleanLastName}-IMPORTED-${timestamp}`;
        logger.info(`Transform lastName: ${customerData.lastname} → ${modifiedData.lastname}`);
    } else {
        logger.warn(`Customer ${customerData.customerNo} has no lastname field`);
    }
    
    return modifiedData;
}

function updateCustomer(customerData) {
    if (!customerData.customerNo) {
        logger.error('Missing customer number');
        return false;
    }
    
    const customer = CustomerMgr.getCustomerByCustomerNumber(customerData.customerNo);
    if (!customer) {
        logger.error('Customer not found: ' + customerData.customerNo);
        return false;
    }
    
    const profile = customer.getProfile();
    if (!profile) {
        logger.error('Customer profile not found: ' + customerData.customerNo);
        return false;
    }
    
    const modifiedData = applyDataTransformations(customerData);
    
    try {
        Transaction.wrap(function() {
            // Update basic profile data
            if (modifiedData.firstname && profile.firstName !== modifiedData.firstname) {
                profile.firstName = modifiedData.firstname;
            }
            
            if (modifiedData.lastname && profile.lastName !== modifiedData.lastname) {
                profile.lastName = modifiedData.lastname;
            }
            
            if (modifiedData.email && profile.email !== modifiedData.email) {
                profile.email = modifiedData.email;
            }
            
            // Update custom attributes
            if (modifiedData['newsletter-subscribed']) {
                const newsletterSubscribed = modifiedData['newsletter-subscribed'] === 'true';
                if (profile.custom.newsletterSubscribed !== newsletterSubscribed) {
                    profile.custom.newsletterSubscribed = newsletterSubscribed;
                    profile.custom.isExported = false;
                }
            }
            
            if (modifiedData['newsletter-email'] && profile.custom.newsletterEmail !== modifiedData['newsletter-email']) {
                profile.custom.newsletterEmail = modifiedData['newsletter-email'];
            }
        });
        
        return true;
        
    } catch (error) {
        logger.error(`Error updating customer ${customerData.customerNo}: ${error.message}`);
        return false;
    }
}

function postProcessFile(xmlFile, action, archivePath) {
    const actions = {
        'remove': () => removeFile(xmlFile),
        'archive': () => archiveFile(xmlFile, archivePath),
        'archive_zip': () => archiveFileZipped(xmlFile, archivePath)
    };
    
    try {
        if (!actions[action]) {
            return { success: false, error: 'Unknown post-process action: ' + action };
        }
        return actions[action]();
    } catch (error) {
        return { success: false, error: error.message };
    }
}

function removeFile(xmlFile) {
    const deleted = xmlFile.remove();
    if (deleted) {
        logger.info('Removed file: ' + xmlFile.getName());
        return { success: true };
    }
    return { success: false, error: 'Failed to delete file' };
}

function archiveFile(xmlFile, archivePath) {
    const archiveDirectory = FileSystemHelper.ensureImpexPath(archivePath);
    if (!archiveDirectory) {
        return { success: false, error: 'Failed to create archive directory' };
    }
    
    const archiveFile = new File(archiveDirectory.getFullPath() + File.SEPARATOR + xmlFile.getName());
    const moved = xmlFile.renameTo(archiveFile);
    
    if (moved) {
        logger.info(`Archived file: ${xmlFile.getName()} to ${archivePath}`);
        return { success: true };
    }
    return { success: false, error: 'Failed to move file to archive' };
}

function archiveFileZipped(xmlFile, archivePath) {
    const archiveDirectory = FileSystemHelper.ensureImpexPath(archivePath);
    if (!archiveDirectory) {
        return { success: false, error: 'Failed to create archive directory' };
    }
    
    const originalName = xmlFile.getName();
    const baseName = originalName.substring(0, originalName.lastIndexOf('.'));
    const zipFileName = `${baseName}.zip`;
    const zipFilePath = archiveDirectory.getFullPath() + File.SEPARATOR + zipFileName;
    
    const zipFile = new File(zipFilePath);
    const moved = xmlFile.renameTo(zipFile);
    
    if (moved) {
        logger.info(`Archived and zipped file: ${originalName} to ${zipFileName}`);
        return { success: true };
    }
    return { success: false, error: 'Failed to archive as zip' };
}

exports.execute = execute;