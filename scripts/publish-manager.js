#!/usr/bin/env node

// @ts-check
'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Update version in package.json
 * @param {string} packagePath Path to package.json
 * @param {string} version New version
 * @param {boolean} [updateDependencies] Whether to update extensionPack versions
 */
function updateVersion(packagePath, version, updateDependencies = false) {
    const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    pkg.version = version;

    // Update extensionPack versions if this is the master collection
    if (updateDependencies && pkg.extensionPack) {
        pkg.extensionPack = pkg.extensionPack.map(ext => {
            const [publisher, name] = ext.split('.');
            return `${publisher}.${name}@${version}`;
        });
    }

    fs.writeFileSync(packagePath, JSON.stringify(pkg, null, 2) + '\n');
}

/**
 * Update all package versions
 * @param {string} version New version
 */
function updateAllVersions(version) {
    const packages = [
        { path: 'core-dev-essentials/package.json', master: false },
        { path: 'python-dev-essentials/package.json', master: false },
        { path: 'documentation-essentials/package.json', master: false },
        { path: 'package.json', master: true }
    ];

    console.log(`\n=== Updating Versions to ${version} ===\n`);
    
    packages.forEach(pkg => {
        const fullPath = path.join(__dirname, '..', pkg.path);
        try {
            updateVersion(fullPath, version, pkg.master);
            console.log(`✅ Updated ${pkg.path} to ${version}`);
        } catch (error) {
            console.error(`❌ Error updating ${pkg.path}:`, error.message);
            process.exit(1);
        }
    });
}

/**
 * Check if version exists
 * @param {string} extension Extension ID
 * @param {string} version Version to check
 * @returns {boolean} True if version exists
 */
function versionExists(extension, version) {
    try {
        const result = execSync(`vsce show ${extension} ${version}`, { stdio: 'pipe' });
        return result.toString().includes(version);
    } catch (error) {
        return false;
    }
}

/**
 * Unpublish version
 * @param {string} extension Extension ID
 * @param {string} version Version to unpublish
 */
function unpublishVersion(extension, version, force = false) {
    try {
        console.log(`Unpublishing ${extension}@${version}...`);
        const command = force
            ? `vsce unpublish ${extension} ${version} --force`
            : `vsce unpublish ${extension} ${version}`;
        execSync(command, { stdio: 'inherit' });
        console.log(`✅ Successfully unpublished ${extension}@${version}`);
    } catch (error) {
        console.error(`❌ Error unpublishing ${extension}@${version}:`, error.message);
    }
}

/**
 * Publish all packages
 * @param {string} version Version to publish
 */
function publishAll(version, force = false) {
    console.log('\n=== Publishing Packages ===\n');

    const extensions = [
        'ih8sirdavi.core-dev-essentials',
        'ih8sirdavi.python-dev-essentials',
        'ih8sirdavi.documentation-essentials',
        'ih8sirdavi.vscode-master-collection'
    ];

    // Check and unpublish existing versions
    extensions.forEach(ext => {
        if (versionExists(ext, version)) {
            unpublishVersion(ext, version, force);
        }
    });

    // Publish new versions
    try {
        // First unpublish if force is true
        if (force) {
            extensions.forEach(ext => {
                try {
                    execSync(`vsce unpublish ${ext} ${version} --force`, { stdio: 'inherit' });
                } catch (error) {
                    // Ignore errors if version doesn't exist
                    console.log(`⚠️ Could not unpublish ${ext}@${version} (may not exist)`);
                }
            });
        }

        // Then publish new versions
        execSync('pnpm -r exec vsce publish --allow-missing-repository', { stdio: 'inherit' });
    } catch (error) {
        console.error('❌ Error publishing packages:', error.message);
        process.exit(1);
    }
}

/**
 * Run cleanup script
 */
function runCleanup() {
    console.log('\n=== Running Cleanup ===\n');
    try {
        execSync('node scripts/cleanup-extensions.js', { stdio: 'inherit' });
    } catch (error) {
        console.error('❌ Error running cleanup:', error.message);
        process.exit(1);
    }
}

/**
 * Main publish process
 * @param {string} version Version to publish
 */
async function publish(version) {
    console.log(`Starting publish process for version ${version}`);
    
    // Update versions
    updateAllVersions(version);
    
    // Run cleanup to ensure fresh state
    runCleanup();
    
    // Publish all packages
    publishAll(version);
    
    console.log('\n✨ Publish process complete!\n');
}

// Parse command line arguments
const args = process.argv.slice(2);
const version = args[0];
const force = args.includes('--force');

if (!version) {
    console.error('Please provide a version number');
    console.log('Usage: node publish-manager.js <version> [--force]');
    console.log('Example: node publish-manager.js 0.2.0');
    console.log('Options:');
    console.log('  --force    Skip confirmation prompts');
    process.exit(1);
}

// Run publish process
publish(version, force);

// Update main publish function
async function publish(version, force = false) {
    console.log(`Starting publish process for version ${version}`);
    
    // Update versions
    updateAllVersions(version);
    
    // Run cleanup to ensure fresh state
    runCleanup();
    
    // Publish all packages
    publishAll(version, force);
    
    console.log('\n✨ Publish process complete!\n');
}