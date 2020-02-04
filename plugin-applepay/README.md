# Storefront Reference Architecture (SFRA)

This is a repository for the ApplePay plugin for Storefront Reference Architecture.


# Getting Started

1. Clone this repository.
2. Install npm dependancies `npm install`
3. Open package.json file and modify `paths.base` property to point to the local directory containing the Storefront Reference Architecture project
4. Run `npm run compile:js && npm run compile:scss` to create client-side assets
5. Upload the `cartridges` folder to the WebDav location for cartridges for your Sandbox through CyberDuck or any other WebDAV client.

# NPM scripts
Use the provided NPM scripts to compile and upload changes to your Sandbox.

## Compiling your application

* `npm run compile:scss` - Compiles all scss files into css.
* `npm run compile:js` - Compiles all js files and aggregates them.

## Linting your code

`npm run lint` - Execute linting for all JavaScript and SCSS files in the project. You should run this command before committing your code.

## Watching for changes and uploading

`npm run watch:static` - Watches js and scss files for changes, recompiles them and uploads result to the sandbox. Requires a valid dw.json file at the root that is configured for the sandbox to upload.

`npm run watch:cartridge` - Watches all cartridge files (except for static content) and uploads it to sandbox. Requires a valid dw.json file at the root that is configured for the sandbox to upload.

`npm run watch` - Watches everything and recompiles (if necessary) and uploads to the sandbox. Requires a valid dw.json file at the root that is configured for the sandbox to upload.

