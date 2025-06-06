'use strict';

const Status = require('dw/system/Status');
const CustomerMgr = require('dw/customer/CustomerMgr');
const File = require('dw/io/File');
const FileReader = require('dw/io/FileReader');
const XMLStreamReader = require('dw/io/XMLStreamReader');
const Transaction = require('dw/system/Transaction');
const FileSystemHelper = require('~/cartridge/scripts/helpers/fileSystemHelpers');

function execute(parameters, stepExecution) {
    const impexPath = parameters.ImpexPath || 'src/export/customers';
    const filePattern = parameters.FilePattern || 'customer_export_*.xml';
    const postProcessAction = parameters.PostProcessAction || 'archive';
    const archiveSubfolder = parameters.ArchiveSubfolder || 'archive';
    
    let directory = new File(File.IMPEX + File.SEPARATOR + impexPath);
    
    if (!directory.exists() || !directory.isDirectory()) {
        return new Status(Status.OK, 'NO_FILES_FOUND', 'No XML files found for import');
    }
    
    const regex = new RegExp('^' + filePattern.replace(/\./g, '\\.').replace(/\*/g, '.*') + '$');
    let processedCount = 0;
    
    directory.listFiles(function(file) {
        if (file.isFile() && regex.test(file.getName())) {
            processXMLFile(file);
            FileSystemHelper.postProcessFile(file, postProcessAction, impexPath, archiveSubfolder);
            processedCount++;
        }
        return false; 
    });
    
    if (processedCount === 0) {
        return new Status(Status.OK, 'NO_FILES_FOUND', 'No XML files found matching pattern: ' + filePattern);
    }
    
    return new Status(Status.OK, 'IMPORT_SUCCESS', 'Processed ' + processedCount + ' files');
}

function processXMLFile(xmlFile) {
    let fileReader = new FileReader(xmlFile, 'UTF-8');
    let xmlReader = new XMLStreamReader(fileReader);
    
    while (xmlReader.hasNext()) {
        if (xmlReader.next() == 1 && xmlReader.getLocalName() === 'customer') {
            updateCustomer(xmlReader.getXMLObject());
        }
    }
    
    xmlReader.close();
    fileReader.close();
}

function updateCustomer(customerXML) {
    let customerNo = customerXML.@no.toString();
    
    if (!customerNo) {
        return; 
    }
    
    let customer = CustomerMgr.getCustomerByCustomerNumber(customerNo);
    if (!customer) {
        return; 
    }
    
    let profile = customer.getProfile();
    if (!profile) {
        return; 
    }
    
    if (customerXML.firstname) {
        let xmlFirstName = customerXML.firstname.toString();
        let currentFirstName = profile.firstName || '';
        
        if (currentFirstName !== xmlFirstName) {
            Transaction.wrap(() => {
                profile.firstName = xmlFirstName;
            });
        }
    }
    
    if (customerXML.lastname) {
        let xmlLastName = customerXML.lastname.toString();
        let currentLastName = profile.lastName || '';
        
        if (currentLastName !== xmlLastName) {
            Transaction.wrap(() => {
                profile.lastName = xmlLastName;
            });
        }
    }
    
    if (customerXML.addresses) {
        handleCustomerAddresses(customer, customerXML.addresses);
    }
}

function handleCustomerAddresses(customer, addressesXML) {
    let addresses = addressesXML.address;
    if (!addresses) {
        return;
    }
    
    let addressBook = customer.getProfile().getAddressBook();
    addresses = addresses.length ? addresses : [addresses];
    
    Transaction.wrap(() => {
        for each (let addressXML in addresses) {
            let addressId = addressXML.@id.toString();
            let address = addressBook.getAddress(addressId) || addressBook.createAddress(addressId);
            updateAddressFields(address, addressXML);
        }
    });
}

function updateAddressFields(address, addressXML) {
    if (addressXML.address1) {
        address.setAddress1(addressXML.address1.toString());
    }
    
    if (addressXML.address2) {
        address.setAddress2(addressXML.address2.toString());
    }
    
    if (addressXML.city) {
        address.setCity(addressXML.city.toString());
    }
    
    if (addressXML['house-nr']) {
        address.custom.houseNr = addressXML['house-nr'].toString();
    }
}

exports.execute = execute;