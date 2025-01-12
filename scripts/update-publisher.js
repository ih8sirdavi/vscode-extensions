#!/usr/bin/env node

// @ts-check
'use strict';

const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Get publisher from environment variable
const publisher = process.env.VSCODE_PUBLISHER;
if (!publisher) {
    console.error('❌ VSCODE_PUBLISHER environment variable not set');
    console.log('Please set VSCODE_PUBLISHER in .env file to either:');
    console.log('- ih8sirdavi (development)');
    console.log('- ihatesirdavi (production)');
    process.exit(1);
}

// Package paths
const packages = [
    'package.json',
    'core-dev-essentials/package.json',
    'python-dev-essentials/package.json',
    'documentation-essentials/package.json'
];

// Repository info
const githubOrg = process.env.GITHUB_ORG || 'sirdavi-portfolio';
const githubRepo = process.env.GITHUB_REPO || 'vscode-extensions';

console.log(`Updating publisher to: ${publisher}`);
console.log(`Repository: ${githubOrg}/${githubRepo}\n`);

let successCount = 0;
let errorCount = 0;

// Update each package.json
packages.forEach(packagePath => {
    try {
        const fullPath = path.join(__dirname, '..', packagePath);
        const pkg = require(fullPath);
        
        // Update publisher
        pkg.publisher = publisher;
        
        // Update repository URLs
        pkg.repository.url = `https://github.com/${githubOrg}/${githubRepo}.git`;
        if (pkg.homepage) {
            pkg.homepage = `https://github.com/${githubOrg}/${githubRepo}/tree/main/${path.dirname(packagePath)}#readme`;
        }
        if (pkg.bugs) {
            pkg.bugs.url = `https://github.com/${githubOrg}/${githubRepo}/issues`;
        }

        // Write back to file
        fs.writeFileSync(fullPath, JSON.stringify(pkg, null, 2) + '\n');
        console.log(`✅ Updated ${packagePath}`);
        successCount++;
    } catch (error) {
        console.error(`❌ Error updating ${packagePath}:`, error.message);
        errorCount++;
    }
});

console.log('\nUpdate Summary:');
console.log(`✅ Successfully updated: ${successCount}`);
console.log(`❌ Failed to update: ${errorCount}`);

if (errorCount > 0) {
    process.exit(1);
}

console.log('\n✨ All packages updated successfully!');
console.log('Remember to:');
console.log('1. Commit changes');
console.log('2. Run pnpm install to update lockfile');
console.log('3. Test before publishing');