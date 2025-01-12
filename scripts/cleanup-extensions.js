#!/usr/bin/env node

// @ts-check
'use strict';

// Script to help remove redundant VS Code extensions
const { execSync, spawnSync } = require('child_process');

/**
 * Find a working VS Code command from various possible installations
 * @returns {string} The working VS Code command
 * @throws {Error} If no VS Code installation is found
 */
function findWorkingVSCodeCommand() {
    const possibleCommands = [
        'code',              // VS Code Stable
        'code-insiders',     // VS Code Insiders
        'codium',           // VS Codium
        'code-oss'          // VS Code OSS
    ];

    for (const cmd of possibleCommands) {
        try {
            const result = spawnSync(cmd, ['--list-extensions'], { stdio: 'ignore' });
            if (result.status === 0) {
                return cmd;
            }
        } catch (error) {
            // Command not found, try next one
            continue;
        }
    }

    throw new Error('No VS Code installation found. Please ensure VS Code or a fork is installed and in your PATH.');
}

// Extensions to remove
const extensionsToRemove = [
    // Python Extension Packs (redundant)
    'donjayamanne.python-extension-pack',
    'python-extensions-pack',

    // Replaced Python Tools
    'ms-python.autopep8',      // replaced by ruff
    'ms-python.flake8',        // replaced by ruff
    'tht13.python',           // redundant with core
    'tushortz.python-extended-snippets', // use built-in

    // Database Tools (install when needed)
    'cweijan.vscode-database-client2',
    'cweijan.dbclient-jdbc',
    'mongodb.mongodb-vscode',
    'redis.redis-for-vscode',
    'linjun.sqlite-support',
    'rohit-chouhan.sqlite-snippet',

    // Premium/Redundant Tools
    'eamodio.gitlens',        // using non-premium alternatives
    'chrisjsewell.myst-tml-syntax' // not actively used
];

/**
 * Uninstall specified extensions using the detected VS Code command
 * @returns {Promise<void>}
 */
async function uninstallExtensions() {
    console.log('Starting extension cleanup...\n');

    try {
        const vscodeCmd = findWorkingVSCodeCommand();
        console.log(`Using VS Code command: ${vscodeCmd}\n`);

        let successCount = 0;
        let skipCount = 0;
        let errorCount = 0;

        for (const extension of extensionsToRemove) {
            try {
                console.log(`Removing ${extension}...`);
                execSync(`${vscodeCmd} --uninstall-extension ${extension}`, { stdio: 'inherit' });
                console.log(`✅ Successfully removed ${extension}\n`);
                successCount++;
            } catch (error) {
                if (error.message.includes('is not installed')) {
                    console.log(`⚠️ ${extension} is not installed\n`);
                    skipCount++;
                } else {
                    console.error(`❌ Error removing ${extension}: ${error.message}\n`);
                    errorCount++;
                }
            }
        }

        console.log('Cleanup Summary:');
        console.log(`✅ Successfully removed: ${successCount}`);
        console.log(`⚠️ Already uninstalled: ${skipCount}`);
        console.log(`❌ Failed to remove: ${errorCount}`);
        console.log('\nCleanup complete! Please restart your VS Code editor.');

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.log('\nPlease ensure VS Code or a compatible fork is installed and in your system PATH.');
        process.exit(1);
    }
}

// Run the cleanup
uninstallExtensions().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});