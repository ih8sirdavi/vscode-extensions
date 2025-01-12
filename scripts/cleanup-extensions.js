#!/usr/bin/env node

// @ts-check
'use strict';

const { execSync, spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

/**
 * Get VS Code settings path
 * @returns {string} Path to settings.json
 */
function getSettingsPath() {
    const homedir = os.homedir();
    const isWindows = os.platform() === 'win32';
    
    if (isWindows) {
        return path.join(homedir, 'AppData', 'Roaming', 'Code - Insiders', 'User', 'settings.json');
    } else {
        return path.join(homedir, '.config', 'Code - Insiders', 'User', 'settings.json');
    }
}

/**
 * Update VS Code settings to disable extensions
 * @param {string[]} extensions Extensions to disable
 */
function updateSettings(extensions) {
    const settingsPath = getSettingsPath();
    let settings = {};

    // Read existing settings
    if (fs.existsSync(settingsPath)) {
        try {
            settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
        } catch (error) {
            console.error('Error reading settings:', error.message);
            return;
        }
    }

    // Update disabled extensions
    settings['extensions.disableExtensions'] = false;
    settings['extensions.ignoreRecommendations'] = true;
    if (!settings['extensions.disabled']) {
        settings['extensions.disabled'] = [];
    }

    // Add extensions to disable list if not already present
    extensions.forEach(ext => {
        if (!settings['extensions.disabled'].includes(ext)) {
            settings['extensions.disabled'].push(ext);
        }
    });

    // Write updated settings
    try {
        fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
        console.log('✅ Successfully updated settings to disable extensions');
    } catch (error) {
        console.error('Error updating settings:', error.message);
    }
}

/**
 * Get VS Code installation paths based on OS
 * @returns {string[]} Array of possible VS Code paths
 */
function getVSCodePaths() {
    const isWindows = os.platform() === 'win32';
    const homedir = os.homedir();

    if (isWindows) {
        return [
            path.join(homedir, 'AppData', 'Local', 'Programs', 'Microsoft VS Code Insiders', 'bin', 'code-insiders.cmd'),
            path.join(homedir, 'AppData', 'Local', 'Programs', 'Microsoft VS Code', 'bin', 'code.cmd')
        ];
    } else {
        return [
            '/usr/bin/code-insiders',
            '/usr/bin/code'
        ];
    }
}

/**
 * Find a working VS Code command
 * @returns {string} The working VS Code command
 */
function findWorkingVSCodeCommand() {
    // Try specific paths first
    const vscodePaths = getVSCodePaths();
    for (const vscPath of vscodePaths) {
        if (fs.existsSync(vscPath)) {
            return `"${vscPath}"`;
        }
    }

    // Fallback to PATH
    const possibleCommands = ['code-insiders', 'code'];
    for (const cmd of possibleCommands) {
        try {
            const result = spawnSync(cmd, ['--version'], { stdio: 'ignore' });
            if (result.status === 0) {
                return cmd;
            }
        } catch (error) {
            continue;
        }
    }

    throw new Error('No VS Code installation found. Please ensure VS Code or a fork is installed.');
}

// Extensions to always keep
const ESSENTIAL_EXTENSIONS = new Set([
    // Core VS Code
    'vscode.git',
    'vscode.git-base',
    'vscode.github',
    'vscode.github-authentication',
    'vscode.json-language-features',
    'vscode.markdown-language-features',
    'vscode.microsoft-authentication',
    'vscode.references-view',
    'vscode.js-debug',
    'vscode.js-debug-companion',

    // GitHub Tools
    'github.vscode-pull-request-github',
    'github.vscode-github-actions',

    // Python Tools
    'ms-python.python',
    'ms-python.vscode-pylance',
    'ms-python.debugpy',

    // Our Collections
    'ih8sirdavi.vscode-master-collection',
    'ih8sirdavi.core-dev-essentials',
    'ih8sirdavi.python-dev-essentials',
    'ih8sirdavi.documentation-essentials'
]);

// Extensions to disable after installation
const EXTENSIONS_TO_DISABLE = [
    // Jupyter Extensions
    'ms-toolsai.jupyter',
    'ms-toolsai.jupyter-keymap',
    'ms-toolsai.jupyter-renderers',
    'ms-toolsai.vscode-jupyter-cell-tags',
    'ms-toolsai.vscode-jupyter-slideshow',

    // Docker & Container Extensions
    'ms-azuretools.vscode-docker',
    'ms-vscode-remote.remote-containers',
    'ms-azuretools.vscode-docker-compose',
    'ms-kubernetes-tools.vscode-kubernetes-tools',
    'mindaro.mindaro',
    'mindaro-dev.file-downloader'
];

// Extension dependencies to handle together
const EXTENSION_GROUPS = {
    'mindaro.mindaro': ['mindaro-dev.file-downloader'],
    'ms-kubernetes-tools.vscode-kubernetes-tools': ['redhat.vscode-yaml'],
    'ms-azuretools.vscode-docker': ['ms-azuretools.vscode-docker-compose']
};

// Get all dependencies for an extension
function getDependencies(extension) {
    const deps = new Set();
    if (EXTENSION_GROUPS[extension]) {
        EXTENSION_GROUPS[extension].forEach(dep => {
            deps.add(dep);
            const subDeps = getDependencies(dep);
            subDeps.forEach(d => deps.add(d));
        });
    }
    return deps;
}

/**
 * Get currently installed extensions
 * @param {string} vscodeCmd The VS Code command to use
 * @returns {string[]} Array of installed extension IDs
 */
function getInstalledExtensions(vscodeCmd) {
    try {
        const output = execSync(`${vscodeCmd} --list-extensions`, { encoding: 'utf8' });
        return output.split('\n').filter(line => line.trim());
    } catch (error) {
        console.error('Error getting installed extensions:', error.message);
        return [];
    }
}

/**
 * Check if an extension should be kept
 * @param {string} extension Extension ID
 * @returns {boolean} True if the extension should be kept
 */
function shouldKeepExtension(extension) {
    return (
        ESSENTIAL_EXTENSIONS.has(extension) ||
        extension.startsWith('vscode.') // Built-in extensions
    );
}

/**
 * Get all extensions to remove including dependencies
 * @param {string[]} extensions List of extensions
 * @returns {string[]} List of extensions to remove
 */
function getAllExtensionsToRemove(extensions) {
    const toRemove = new Set();
    
    extensions.forEach(ext => {
        if (!shouldKeepExtension(ext)) {
            toRemove.add(ext);
            // Add dependencies
            getDependencies(ext).forEach(dep => toRemove.add(dep));
        }
    });

    return Array.from(toRemove);
}

/**
 * Clean and reinstall extensions
 * @returns {Promise<void>}
 */
async function cleanAndReinstall() {
    console.log('Starting extension cleanup and reinstall...\n');

    try {
        const vscodeCmd = findWorkingVSCodeCommand();
        console.log(`Using VS Code command: ${vscodeCmd}\n`);

        // Get currently installed extensions
        const installedExtensions = getInstalledExtensions(vscodeCmd);
        console.log('Currently installed extensions:', installedExtensions, '\n');

        // Find extensions to remove (including dependencies)
        const extensionsToRemove = getAllExtensionsToRemove(installedExtensions);
        console.log('Extensions to remove:', extensionsToRemove, '\n');

        let successCount = 0;
        let skipCount = 0;
        let errorCount = 0;
        let keptCount = installedExtensions.length - extensionsToRemove.length;

        // Remove extensions in dependency order
        console.log('=== Removing Extensions ===\n');
        for (const extension of extensionsToRemove) {
            try {
                // Skip if it's a dependency of a kept extension
                const parentExtension = Object.keys(EXTENSION_GROUPS).find(key =>
                    EXTENSION_GROUPS[key].includes(extension)
                );
                if (parentExtension && !extensionsToRemove.includes(parentExtension)) {
                    console.log(`⚠️ Keeping ${extension} (required dependency)\n`);
                    keptCount++;
                    continue;
                }

                console.log(`Removing ${extension}...`);
                execSync(`${vscodeCmd} --uninstall-extension ${extension}`, { stdio: 'inherit' });
                console.log(`✅ Successfully removed ${extension}\n`);
                successCount++;
            } catch (error) {
                const errorMsg = error.message.toLowerCase();
                if (errorMsg.includes('is not installed')) {
                    console.log(`⚠️ ${extension} is not installed\n`);
                    skipCount++;
                } else {
                    console.error(`❌ Error removing ${extension}: ${error.message}\n`);
                    errorCount++;
                }
            }
        }

        // Uninstall all ih8sirdavi extensions
        console.log('\n=== Uninstalling Current Extensions ===\n');
        const ih8Extensions = [
            'ih8sirdavi.vscode-master-collection',
            'ih8sirdavi.core-dev-essentials',
            'ih8sirdavi.python-dev-essentials',
            'ih8sirdavi.documentation-essentials'
        ];

        for (const ext of ih8Extensions) {
            try {
                console.log(`Uninstalling ${ext}...`);
                execSync(`${vscodeCmd} --uninstall-extension ${ext}`, { stdio: 'inherit' });
                console.log(`✅ Successfully uninstalled ${ext}\n`);
            } catch (error) {
                // Ignore errors if not installed
                console.log(`⚠️ ${ext} not installed or already uninstalled\n`);
            }
        }

        // Install master collection
        console.log('\n=== Installing Master Collection ===\n');
        try {
            console.log('Installing master collection...');
            execSync(`${vscodeCmd} --install-extension ih8sirdavi.vscode-master-collection`, { stdio: 'inherit' });
            console.log('✅ Successfully installed master collection\n');
        } catch (error) {
            console.error('❌ Error installing master collection:', error.message);
            console.log('Please install manually: code --install-extension ih8sirdavi.vscode-master-collection\n');
        }

        // Disable optional extensions via settings.json
        console.log('\n=== Disabling Optional Extensions ===\n');
        updateSettings(EXTENSIONS_TO_DISABLE);

        console.log('Cleanup Summary:');
        console.log(`✅ Successfully removed: ${successCount}`);
        console.log(`⚠️ Already uninstalled: ${skipCount}`);
        console.log(`❌ Failed to remove: ${errorCount}`);
        console.log(`🔒 Extensions kept: ${keptCount}`);
        console.log('   Including:');
        console.log('   - Built-in VS Code extensions');
        console.log('   - Microsoft development tools');
        console.log('   - GitHub integration tools');
        console.log('   - Remote development extensions');
        console.log('   - Azure development tools');
        console.log('   - Python tools');
        console.log('\n🔧 Optional extensions disabled in settings.json:');
        console.log('   - Jupyter and related extensions');
        console.log('   - Docker, Kubernetes, and container extensions');
        console.log('\n✨ Master collection installed - all required extensions will be available after restart.');
        console.log('\nPlease restart VS Code to complete the process.');

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.log('\nPlease ensure VS Code or a compatible fork is installed.');
        process.exit(1);
    }
}

// Run the cleanup and reinstall
cleanAndReinstall().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});