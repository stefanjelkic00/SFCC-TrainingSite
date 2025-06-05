'use strict';

const Logger = require('dw/system/Logger');
const Status = require('dw/system/Status');
const CustomerMgr = require('dw/customer/CustomerMgr');
const File = require('dw/io/File');
const FileReader = require('dw/io/FileReader');
const XMLStreamReader = require('dw/io/XMLStreamReader');
const Transaction = require('dw/system/Transaction');
const FileSystemHelper = require('~/cartridge/scripts/helpers/fileSystemHelpers');
const importLogger = Logger.getLogger('CustomerImport', 'CustomerImport');

function execute(parameters, stepExecution) {
    const impexPath = parameters.ImpexPath || 'src/export/customers';
    const filePattern = parameters.FilePattern || 'customer_export_*.xml';
    const postProcessAction = parameters.PostProcessAction || 'archive';
    const archiveSubfolder = parameters.ArchiveSubfolder || 'archive';
    
    let directory = new File(File.IMPEX + File.SEPARATOR + impexPath);
    
    if (!directory.exists() || !directory.isDirectory()) {
        importLogger.warn('IMPEX directory does not exist or is empty: ' + directory.getFullPath());
        return new Status(Status.OK, 'NO_FILES_FOUND', 'No XML files found for import');
    }
    
    const regex = new RegExp('^' + filePattern.replace(/\./g, '\\.').replace(/\*/g, '.*') + '$');
    
    const matchingFiles = directory.listFiles(function(file) {
        return file.isFile() && regex.test(file.getName());
    });
    
    if (!matchingFiles || matchingFiles.length === 0) {
        return new Status(Status.OK, 'NO_FILES_FOUND', 'No XML files found matching pattern: ' + filePattern);
    }
    
    for each (var file in matchingFiles) {
        processXMLFile(file);
        FileSystemHelper.postProcessFile(file, postProcessAction, impexPath, archiveSubfolder);
    }
    
    return new Status(Status.OK, 'IMPORT_SUCCESS', 'Processed ' + matchingFiles.length + ' files');
}

function processXMLFile(xmlFile) {
    let fileReader = new FileReader(xmlFile, 'UTF-8');
    let xmlReader = new XMLStreamReader(fileReader);
    
    while (xmlReader.hasNext()) {
        if (xmlReader.next() == 1 && xmlReader.getLocalName() === 'customer') {
            let customerXML = xmlReader.getXMLObject();
            updateCustomer(customerXML);
        }
    }
    
    xmlReader.close();
    fileReader.close();
}

function updateCustomer(customerXML) {
    let customerNo = customerXML.@no.toString();
    let customer = customerNo && CustomerMgr.getCustomerByCustomerNumber(customerNo);
    let profile = customer && customer.getProfile();
    
    if (profile && customerXML.lastname) {
        let newLastName = customerXML.lastname.toString().replace(/-(?:IMPORTED.*|CHANGED.*|I)$/, '') + '-I';
        profile.lastName !== newLastName && Transaction.wrap(() => profile.lastName = newLastName);
    }
    
    customer && customerXML.addresses && handleCustomerAddresses(customer, customerXML.addresses);
}

function handleCustomerAddresses(customer, addressesXML) {
    let addresses = addressesXML.address;
    if (!addresses) return;
    
    let addressBook = customer.getProfile().getAddressBook();
    addresses = addresses.length ? addresses : [addresses];
    
    for each (let addressXML in addresses) {
        let addressId = addressXML.@id.toString();
        let address = addressBook.getAddress(addressId) || addressBook.createAddress(addressId);
        Transaction.wrap(() => updateAddressFields(address, addressXML));
    }
}

function updateAddressFields(address, addressXML) {
    addressXML.address1 && address.setAddress1(addressXML.address1.toString());
    addressXML.address2 && address.setAddress2(addressXML.address2.toString());
    addressXML.city && address.setCity(addressXML.city.toString());
    addressXML['house-nr'] && (address.custom.houseNr = addressXML['house-nr'].toString());
}

exports.execute = execute;