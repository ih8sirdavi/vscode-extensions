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
    
    // Try VSCode Insiders first (primary)
    if (isWindows) {
        const insidersPath = path.join(homedir, 'AppData', 'Roaming', 'Code - Insiders', 'User', 'settings.json');
        if (fs.existsSync(insidersPath)) return insidersPath;
        
        // Fallback paths for other forks
        const possiblePaths = [
            path.join(homedir, 'AppData', 'Roaming', 'Code', 'User', 'settings.json'),
            path.join(homedir, 'AppData', 'Roaming', 'VSCodium', 'User', 'settings.json'),
            path.join(homedir, 'AppData', 'Roaming', 'Code - Exploration', 'User', 'settings.json')
        ];
        
        for (const p of possiblePaths) {
            if (fs.existsSync(p)) return p;
        }
        
        // Default to Insiders if no existing path found
        return insidersPath;
    } else {
        const insidersPath = path.join(homedir, '.config', 'Code - Insiders', 'User', 'settings.json');
        if (fs.existsSync(insidersPath)) return insidersPath;
        
        // Fallback paths for other forks
        const possiblePaths = [
            path.join(homedir, '.config', 'Code', 'User', 'settings.json'),
            path.join(homedir, '.config', 'VSCodium', 'User', 'settings.json'),
            path.join(homedir, '.config', 'Code - Exploration', 'User', 'settings.json')
        ];
        
        for (const p of possiblePaths) {
            if (fs.existsSync(p)) return p;
        }
        
        // Default to Insiders if no existing path found
        return insidersPath;
    }
}

// Load environment variables
require('dotenv').config();

// Get publisher from environment
const publisher = process.env.VSCODE_PUBLISHER || 'ih8sirdavi';

// Collections and essential extensions to recommend
const RECOMMENDED_EXTENSIONS = [
    // Collections (will auto-install their extension packs)
    `${publisher}.vscode-master-collection`,
    `${publisher}.core-dev-essentials`,
    `${publisher}.python-dev-essentials`,
    `${publisher}.documentation-essentials`,
    
    // Essential standalone extensions
    'rooveterinaryinc.roo-cline'
];

/**
 * Update VS Code settings
 * @param {string[]} disabledExtensions Extensions to disable
 */
function updateSettings(disabledExtensions) {
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
    settings['extensions.ignoreRecommendations'] = false;
    if (!settings['extensions.disabled']) {
        settings['extensions.disabled'] = [];
    }

    // Add extensions to disable list if not already present
    disabledExtensions.forEach(ext => {
        if (!settings['extensions.disabled'].includes(ext)) {
            settings['extensions.disabled'].push(ext);
        }
    });

    // Update recommended extensions
    if (!settings['extensions.recommendations']) {
        settings['extensions.recommendations'] = [];
    }

    // Add recommended extensions if not already present
    RECOMMENDED_EXTENSIONS.forEach(ext => {
        if (!settings['extensions.recommendations'].includes(ext)) {
            settings['extensions.recommendations'].push(ext);
        }
    });

    // Write updated settings
    try {
        fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
        console.log('✅ Successfully updated settings');
        console.log('   - Updated disabled extensions');
        console.log('   - Updated recommended extensions');
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
            // Insiders first (primary)
            path.join(homedir, 'AppData', 'Local', 'Programs', 'Microsoft VS Code Insiders', 'bin', 'code-insiders.cmd'),
            // Other forks
            path.join(homedir, 'AppData', 'Local', 'Programs', 'Microsoft VS Code', 'bin', 'code.cmd'),
            path.join(homedir, 'AppData', 'Local', 'Programs', 'VSCodium', 'bin', 'codium.cmd'),
            path.join(homedir, 'AppData', 'Local', 'Programs', 'Code - Exploration', 'bin', 'code-exploration.cmd')
        ];
    } else {
        return [
            // Flatpak installations
            '/var/lib/flatpak/exports/bin/code-insiders',
            '/var/lib/flatpak/exports/bin/code',
            '/var/lib/flatpak/exports/bin/codium',
            // Snap installations
            '/snap/bin/code-insiders',
            '/snap/bin/code',
            '/snap/bin/codium'
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

    // Fallback to PATH with priority order
    const possibleCommands = [
        'code-insiders',  // Try Insiders first
        'code',          // Then regular VS Code
        'codium',        // Then VSCodium
        'code-exploration' // Then other forks
    ];

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

    // If no command found, try without version check (some forks might handle --version differently)
    for (const cmd of possibleCommands) {
        try {
            const result = spawnSync(cmd, ['--help'], { stdio: 'ignore' });
            if (result.status === 0) {
                return cmd;
            }
        } catch (error) {
            continue;
        }
    }

    throw new Error('No VS Code installation found. Please ensure VS Code or a compatible fork is installed.');
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

    // Our Core Extensions
    `${publisher}.vscode-master-collection`,
    `${publisher}.core-dev-essentials`,
    `${publisher}.python-dev-essentials`,
    `${publisher}.documentation-essentials`,
    'rooveterinaryinc.roo-cline',  // Added RooCline as essential
    'rooveterinaryinc.roo-cline-insiders'  // Added RooCline Insiders as essential
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
 * Get extension pack from package.json
 * @param {string} packagePath Path to package.json
 * @returns {string[]} Array of extension IDs
 */
function getExtensionPack(packagePath) {
    try {
        const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
        return packageJson.extensionPack || [];
    } catch (error) {
        console.error(`Error reading ${packagePath}:`, error.message);
        return [];
    }
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
        extension.startsWith('vscode.') || // Built-in extensions
        extension.startsWith('rooveterinaryinc.') // Keep all Roo extensions
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

        // Get all required extensions from collections
        console.log('\n=== Analyzing Required Extensions ===\n');
        
        const collectionPaths = {
            [`${publisher}.core-dev-essentials`]: 'core-dev-essentials/package.json',
            [`${publisher}.python-dev-essentials`]: 'python-dev-essentials/package.json',
            [`${publisher}.documentation-essentials`]: 'documentation-essentials/package.json'
        };

        // Build set of all required extensions
        const allRequired = new Set([
            `${publisher}.vscode-master-collection`,
            ...Object.keys(collectionPaths)
        ]);

        // Add extensions from each collection's package.json
        for (const [collection, packagePath] of Object.entries(collectionPaths)) {
            const extensionPack = getExtensionPack(packagePath);
            extensionPack.forEach(ext => allRequired.add(ext));
        }

        console.log('Required extensions:', Array.from(allRequired), '\n');

        // Find extensions to remove (not required, not essential, and not dependencies)
        const toRemove = installedExtensions.filter(ext => {
            // Skip if it's required or essential
            if (allRequired.has(ext) || shouldKeepExtension(ext)) {
                return false;
            }

            // Check if it's a dependency of any installed extension
            for (const installed of installedExtensions) {
                if (EXTENSION_GROUPS[installed]?.includes(ext)) {
                    console.log(`⚠️ Keeping ${ext} (required by ${installed})`);
                    return false;
                }
            }

            return true;
        });

        // Find extensions to install (required but not installed)
        const toInstall = Array.from(allRequired).filter(ext =>
            !installedExtensions.includes(ext)
        );

        let removeCount = 0;
        let skipCount = 0;
        let dependencyCount = 0;
        let installCount = 0;
        let installErrorCount = 0;
        let keptCount = installedExtensions.length - toRemove.length;

        // Remove unnecessary extensions
        if (toRemove.length > 0) {
            console.log('=== Removing Unnecessary Extensions ===\n');
            for (const ext of toRemove) {
                // Check if it's one of our extensions
                if (ext.startsWith('ih8sirdavi.') || ext.startsWith('ihatesirdavi.')) {
                    const currentPublisher = ext.split('.')[0];
                    if (currentPublisher !== publisher) {
                        try {
                            console.log(`Removing ${ext} (switching publisher)...`);
                            execSync(`${vscodeCmd} --uninstall-extension ${ext}`, { stdio: 'inherit' });
                            console.log(`✅ Successfully removed ${ext}\n`);
                            removeCount++;
                        } catch (error) {
                            const errorMsg = error.message.toLowerCase();
                            if (errorMsg.includes('is not installed') || errorMsg.includes('not found')) {
                                console.log(`⚠️ ${ext} is already uninstalled\n`);
                                skipCount++;
                            } else {
                                console.error(`❌ Unexpected error removing ${ext}: ${error.message}\n`);
                                skipCount++;
                            }
                        }
                    }
                } else {
                    try {
                        console.log(`Removing ${ext}...`);
                        execSync(`${vscodeCmd} --uninstall-extension ${ext}`, { stdio: 'inherit' });
                        console.log(`✅ Successfully removed ${ext}\n`);
                        removeCount++;
                    } catch (error) {
                        const errorMsg = error.message.toLowerCase();
                        if (errorMsg.includes('is not installed') || errorMsg.includes('not found')) {
                            console.log(`⚠️ ${ext} is already uninstalled\n`);
                            skipCount++;
                        } else if (errorMsg.includes('depends on this')) {
                            console.log(`⚠️ Keeping ${ext} (required by another extension)\n`);
                            dependencyCount++;
                        } else {
                            console.error(`❌ Unexpected error removing ${ext}: ${error.message}\n`);
                            skipCount++;
                        }
                    }
                }
            }
        } else {
            console.log('No unnecessary extensions to remove\n');
        }

        // Install missing extensions
        if (toInstall.length > 0) {
            console.log('=== Installing Missing Extensions ===\n');
            for (const ext of toInstall) {
                try {
                    console.log(`Installing ${ext}...`);
                    execSync(`${vscodeCmd} --install-extension ${ext}`, { stdio: 'inherit' });
                    console.log(`✅ Successfully installed ${ext}\n`);
                    installCount++;
                } catch (error) {
                    // If extension not found and it's one of our collections, try the other publisher
                    if (error.message.includes('not found') && ext.startsWith(publisher)) {
                        const altPublisher = publisher === 'ih8sirdavi' ? 'ihatesirdavi' : 'ih8sirdavi';
                        const altExt = ext.replace(publisher, altPublisher);
                        try {
                            console.log(`⚠️ Trying alternate publisher: ${altExt}...`);
                            execSync(`${vscodeCmd} --install-extension ${altExt}`, { stdio: 'inherit' });
                            console.log(`✅ Successfully installed ${altExt}\n`);
                            installCount++;
                        } catch (altError) {
                            console.error(`❌ Error installing ${ext} (and alternate):`, error.message);
                            installErrorCount++;
                        }
                    } else {
                        console.error(`❌ Error installing ${ext}:`, error.message);
                        installErrorCount++;
                    }
                }
            }
        } else {
            console.log('No missing extensions to install\n');
        }

        // Update settings with disabled and recommended extensions
        console.log('\n=== Updating Settings ===\n');
        updateSettings(EXTENSIONS_TO_DISABLE);

        console.log('\nCleanup Summary:');
        console.log(`✅ Successfully removed: ${removeCount}`);
        console.log(`⚠️ Already uninstalled: ${skipCount}`);
        console.log(`⚠️ Dependencies kept: ${dependencyCount}`);
        console.log(`🔒 Essential extensions kept: ${keptCount}`);
        if (installCount > 0 || installErrorCount > 0) {
            console.log(`✨ Extensions installed: ${installCount}`);
            if (installErrorCount > 0) {
                console.log(`❌ Failed to install: ${installErrorCount}`);
            }
        }
        console.log('\n🔧 Settings updated:');
        console.log('   - Added recommended extensions');
        console.log('   - Disabled optional extensions:');
        console.log('     - Jupyter and related extensions');
        console.log('     - Docker, Kubernetes, and container extensions');
        console.log('\n✨ Collections installed - their extension packs will be auto-installed by VSCode');
        console.log('   This includes:');
        console.log('   - Core development tools (from core-dev-essentials)');
        console.log('   - Python development tools (from python-dev-essentials)');
        console.log('   - Documentation tools (from documentation-essentials)');
        console.log('\nPlease restart VS Code to complete the installation process.');

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