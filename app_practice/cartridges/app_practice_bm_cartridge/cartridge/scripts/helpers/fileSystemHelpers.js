'use strict';

const Logger = require('dw/system/Logger');
const File = require('dw/io/File');
const FileWriter = require('dw/io/FileWriter');
const XMLStreamWriter = require('dw/io/XMLStreamWriter');

const logger = Logger.getLogger('fileSystemHelpers', 'fileSystemHelpers');

function ensureImpexPath(impexPath) {
    const directory = new File(`${File.IMPEX}${File.SEPARATOR}${impexPath}`);
    
    if (!directory.exists() && !directory.mkdirs()) {
        logger.error(`Failed to create IMPEX directory: ${directory.getFullPath()}`);
        return null;
    }
    
    return directory;
}

function writeXMLElement(xmlWriter, elementName, value) {
    xmlWriter.writeStartElement(elementName);
    value && xmlWriter.writeCharacters(value.toString());
    xmlWriter.writeEndElement();
}

function getWritters(xmlFilePath) {
    const file = new File(xmlFilePath);
    const fileWriter = new FileWriter(file, 'UTF-8');
    const xmlWriter = new XMLStreamWriter(fileWriter);
    return { xmlWriter, fileWriter };
}

function closeXMLWriter(xmlWriter, fileWriter) {
    xmlWriter && xmlWriter.close();
    fileWriter && fileWriter.close();
}

function postProcessFile(xmlFile, action, sourcePath, archiveSubfolder) {
    switch (action) {
        case 'remove':
            xmlFile.remove();
            break;
        case 'archive':
            archiveFile(xmlFile, sourcePath, archiveSubfolder);
            break;
        case 'archive_zip':
            archiveFileZipped(xmlFile, sourcePath, archiveSubfolder);
            break;
    }
}

function archiveFile(xmlFile, sourcePath, archiveSubfolder) {
    const archivePath = sourcePath + File.SEPARATOR + archiveSubfolder;
    const archiveDirectory = ensureImpexPath(archivePath);
    if (!archiveDirectory) return;
    
    const archiveFile = new File(archiveDirectory.getFullPath() + File.SEPARATOR + xmlFile.getName());
    xmlFile.renameTo(archiveFile);
}

function archiveFileZipped(xmlFile, sourcePath, archiveSubfolder) {
    const archivePath = sourcePath + File.SEPARATOR + archiveSubfolder;
    const archiveDirectory = ensureImpexPath(archivePath);
    if (!archiveDirectory) return;
    
    const originalName = xmlFile.getName();
    const baseName = originalName.substring(0, originalName.lastIndexOf('.'));
    const zipFileName = baseName + '.zip';
    const zipFilePath = archiveDirectory.getFullPath() + File.SEPARATOR + zipFileName;
    
    const zipFile = new File(zipFilePath);
    xmlFile.renameTo(zipFile);
}

module.exports = {
    ensureImpexPath: ensureImpexPath,
    writeXMLElement: writeXMLElement,
    getWritters: getWritters,
    closeXMLWriter: closeXMLWriter,
    postProcessFile: postProcessFile
};