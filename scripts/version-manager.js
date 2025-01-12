#!/usr/bin/env node

// @ts-check
'use strict';

const fs = require('fs');
const path = require('path');

/**
 * Update version in package.json
 * @param {string} packagePath Path to package.json
 * @param {string} version New version
 */
function updateVersion(packagePath, version) {
    const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    pkg.version = version;
    fs.writeFileSync(packagePath, JSON.stringify(pkg, null, 2) + '\n');
}

/**
 * Update all package versions
 * @param {string} version New version
 */
function updateAllVersions(version) {
    const packages = [
        'package.json',
        'core-dev-essentials/package.json',
        'python-dev-essentials/package.json',
        'documentation-essentials/package.json'
    ];

    console.log(`Updating all packages to version ${version}`);
    
    packages.forEach(pkg => {
        const fullPath = path.join(__dirname, '..', pkg);
        try {
            updateVersion(fullPath, version);
            console.log(`✅ Updated ${pkg} to ${version}`);
        } catch (error) {
            console.error(`❌ Error updating ${pkg}:`, error.message);
        }
    });
}

// Get version from command line
const version = process.argv[2];
if (!version) {
    console.error('Please provide a version number');
    console.log('Usage: node version-manager.js <version>');
    console.log('Example: node version-manager.js 0.1.0');
    process.exit(1);
}

// Update all versions
updateAllVersions(version);