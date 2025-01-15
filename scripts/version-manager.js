// @ts-check
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import * as environmentManager from './environment-manager.js';
import * as packageManager from './package-manager.js';

// ES module dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Check version type
 * @param {string} version Version to check
 * @returns {'dev'|'prod'|'main'|null} Version type or null if invalid
 */
function getVersionType(version) {
    const [major, minor, patch] = version.split('.').map(Number);
    
    if (major > 0) {
        // n.0.0 - Main release
        return minor === 0 && patch === 0 ? 'main' : null;
    } else if (minor > 0) {
        // 0.n.0 - Production release
        return patch === 0 ? 'prod' : null;
    } else {
        // 0.0.n - Development release
        return patch > 0 ? 'dev' : null;
    }
}

/**
 * Compare two versions
 * @param {string} version1 First version
 * @param {string} version2 Second version
 * @returns {boolean} True if version1 is higher than version2
 */
function isVersionHigher(version1, version2) {
    const [major1, minor1, patch1] = version1.split('.').map(Number);
    const [major2, minor2, patch2] = version2.split('.').map(Number);

    if (major1 !== major2) return major1 > major2;
    if (minor1 !== minor2) return minor1 > minor2;
    return patch1 > patch2;
}

/**
 * Get current version from a specific branch
 * @param {string} branch Git branch name
 * @returns {Promise<string|null>} Current version or null
 */
async function getCurrentBranchVersion(branch) {
    try {
        const currentBranch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
        
        // Stash changes if any
        const hasChanges = execSync('git status --porcelain', { encoding: 'utf8' }).length > 0;
        if (hasChanges) {
            execSync('git stash');
        }

        // Switch to target branch
        execSync(`git checkout ${branch}`);
        
        // Get version from package.json
        const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        const version = packageJson.version;

        // Switch back and restore changes
        execSync(`git checkout ${currentBranch}`);
        if (hasChanges) {
            execSync('git stash pop');
        }

        return version;
    } catch (error) {
        return null; // Branch or version doesn't exist
    }
}

/**
 * Check if version follows hierarchical rules
 * @param {string} targetVersion Version to validate
 * @param {string} branch Current git branch
 * @returns {Promise<{valid: boolean, error?: string}>} Validation result
 */
/**
 * Validate version and switch to correct branch
 * @param {string} targetVersion Version to validate
 * @returns {Promise<{valid: boolean, errors: string[]}>} Validation result
 */
async function validateAndPrepareVersion(targetVersion) {
    const errors = [];
    const targetType = getVersionType(targetVersion);
    
    // 1. Basic version format validation
    if (!targetType) {
        errors.push(`Invalid version format: ${targetVersion}`);
        return { valid: false, errors };
    }

    // 2. Get current versions and determine required branch
    const devVersion = await getCurrentBranchVersion('dev');
    const prodVersion = await getCurrentBranchVersion('production');
    const mainVersion = await getCurrentBranchVersion('main');
    
    const requiredBranch = targetType === 'dev' ? 'dev' :
                          targetType === 'prod' ? 'production' : 'main';

    // 3. Version hierarchy validation
    if (targetType === 'prod' && devVersion && !isVersionHigher(targetVersion, devVersion)) {
        errors.push(`Production version must be higher than ${devVersion}`);
    }
    if (targetType === 'main' && prodVersion && !isVersionHigher(targetVersion, prodVersion)) {
        errors.push(`Main version must be higher than ${prodVersion}`);
    }

    // 4. Switch to required branch if needed
    try {
        const currentBranch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
        if (currentBranch !== requiredBranch) {
            // Stash changes if any
            const hasChanges = execSync('git status --porcelain', { encoding: 'utf8' }).length > 0;
            if (hasChanges) {
                execSync('git stash');
            }

            try {
                execSync(`git checkout ${requiredBranch}`, { stdio: 'inherit' });
                console.log(`✅ Switched to ${requiredBranch} branch`);
            } catch (error) {
                errors.push(`Failed to switch to ${requiredBranch} branch`);
            }

            // Restore changes if any
            if (hasChanges) {
                try {
                    execSync('git stash pop');
                } catch (error) {
                    errors.push('Failed to restore stashed changes');
                }
            }
        }
    } catch (error) {
        errors.push('Failed to determine current branch');
    }

    // 5. Summarize validation results
    if (errors.length > 0) {
        console.error('\nValidation Errors:');
        errors.forEach(error => console.error(`❌ ${error}`));
        return { valid: false, errors };
    }

    return { valid: true, errors: [] };
}

/**
 * Check if version is production release
 * @param {string} version Version to check
 * @returns {boolean} True if production version (0.n.0)
 */
function isProductionVersion(version) {
    return getVersionType(version) === 'prod';
}

/**
 * Check if version is development release
 * @param {string} version Version to check
 * @returns {boolean} True if development version (0.0.n)
 */
function isDevelopmentVersion(version) {
    return getVersionType(version) === 'dev';
}

/**
 * Check if version is main release
 * @param {string} version Version to check
 * @returns {boolean} True if main version (n.0.0)
 */
function isMainVersion(version) {
    return getVersionType(version) === 'main';
}

/**
 * Switch environment based on version pattern
 * @param {string} version Version to check
 */
async function switchEnvironmentForVersion(version) {
    const type = getVersionType(version);
    if (!type) {
        throw new Error(`Invalid version pattern: ${version}`);
    }

    if (type === 'main') {
        throw new Error('Main versions must be published manually from organization repository');
    }

    const isProduction = type === 'prod';
    if (isProduction) {
        console.log(`\nSwitching to production environment for version ${version} (0.n.0)...`);
        await environmentManager.updateEnvironment(true);
        await environmentManager.updateGitRemote(true, version);
    } else {
        console.log(`\nSwitching to development environment for version ${version} (0.0.n)...`);
        await environmentManager.updateEnvironment(false);
        await environmentManager.updateGitRemote(false, version);
    }

    // Reload environment after switch
    require('dotenv').config({ override: true });
    process.env = { ...process.env };
}

/**
 * Get collections from environment
 * @returns {string[]} Collection names
 */
function getCollections() {
    const collections = process.env.VSCODE_COLLECTIONS?.split(',') || [];
    if (collections.length === 0) {
        throw new Error('VSCODE_COLLECTIONS environment variable not set');
    }
    // Sort to ensure individual packages come before master collection
    return collections.sort((a, b) => {
        const isMasterA = a.includes('master');
        const isMasterB = b.includes('master');
        return isMasterA === isMasterB ? 0 : isMasterA ? 1 : -1;
    });
}

/**
 * Get current version of an extension
 * @param {string} collection Extension collection name
 * @returns {Promise<string|null>} Current version or null if not published
 */
async function getCurrentVersion(collection) {
    try {
        const result = packageManager.execCommand(`vsce show ${process.env.VSCODE_PUBLISHER}.${collection}`, { 
            stdio: ['pipe', 'pipe', 'pipe']
        });
        return result.match(/Version:\s+(\d+\.\d+\.\d+)/)?.[1] || null;
    } catch (error) {
        return null;
    }
}

/**
 * Get highest version from all packages
 * @returns {Promise<string>} Highest version
 */
async function getHighestVersion() {
    const collections = getCollections();
    let highest = '0.0.0';

    for (const collection of collections) {
        const version = await getCurrentVersion(collection);
        if (version) {
            const [majorA, minorA, patchA] = highest.split('.').map(Number);
            const [majorB, minorB, patchB] = version.split('.').map(Number);
            
            if (majorB > majorA || 
                (majorB === majorA && minorB > minorA) ||
                (majorB === majorA && minorB === minorA && patchB > patchA)) {
                highest = version;
            }
        }
    }

    return highest;
}

/**
 * Update package.json version
 * @param {string} collection Extension collection name
 * @param {string} version New version
 * @returns {Promise<boolean>} Success status
 */
async function updatePackageVersion(collection, version) {
    try {
        const packagePath = collection === 'vscode-master-collection'
            ? path.join(__dirname, '..', 'package.json')
            : path.join(__dirname, '..', collection, 'package.json');

        const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
        packageJson.version = version;
        fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));
        console.log(`✅ Updated ${collection} version to ${version}`);
        return true;
    } catch (error) {
        console.error(`Failed to update ${collection} version:`, error instanceof Error ? error.message : String(error));
        return false;
    }
}

/**
 * Unpublish an extension
 * @param {string} collection Extension collection name
 * @param {string} [version] Specific version to unpublish
 * @returns {Promise<boolean>} Success status
 */
async function unpublishExtension(collection, version = '') {
    const versionFlag = version ? ` ${version}` : '';
    console.log(`Unpublishing ${collection}${versionFlag}...`);
    try {
        // Try both publishers to ensure complete cleanup
        try {
            packageManager.execCommand(`vsce unpublish ih8sirdavi.${collection}${versionFlag} --force`, {
                stdio: 'inherit'
            });
        } catch (error) {
            console.log('Note: No dev version to unpublish');
        }

        try {
            packageManager.execCommand(`vsce unpublish ihatesirdavi.${collection}${versionFlag} --force`, {
                stdio: 'inherit'
            });
        } catch (error) {
            console.log('Note: No prod version to unpublish');
        }

        return true;
    } catch (error) {
        console.error(`Failed to unpublish ${collection}:`, error instanceof Error ? error.message : String(error));
        return false;
    }
}

/**
 * Publish an extension
 * @param {string} collection Extension collection name
 * @param {string} version Version to publish
 * @returns {Promise<boolean>} Success status
 */
async function publishExtension(collection, version) {
    console.log(`Publishing ${collection}@${version}...`);
    try {
        // Get current branch
        const currentBranch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
        
        // Validate version and prepare environment
        const validation = await validateAndPrepareVersion(version);
        if (!validation.valid) {
            throw new Error('Version validation failed:\n' + validation.errors.join('\n'));
        }

        const versionType = getVersionType(version);

        const cwd = collection === 'vscode-master-collection'
            ? path.join(__dirname, '..')
            : path.join(__dirname, '..', collection);
        
        // Switch environment based on version type
        const isProduction = versionType !== 'dev';
        await switchEnvironmentForVersion(version);

        // Get current publisher from environment
        const publisher = process.env.VSCODE_PUBLISHER;
        if (!publisher) {
            throw new Error('Publisher not set in environment');
        }

        // Validate publisher matches version type
        const expectedPublisher = isProduction ? 'ihatesirdavi' : 'ih8sirdavi';
        if (publisher !== expectedPublisher) {
            throw new Error(`Version ${version} must be published as ${expectedPublisher}`);
        }

        console.log(`Publishing as ${publisher}...`);

        // Publish with explicit publisher
        packageManager.execCommand(`vsce publish ${version} --no-dependencies --publisher ${publisher}`, {
            stdio: 'inherit',
            cwd
        });

        // Commit and push changes after successful publish
        await environmentManager.commitVersionChanges(version, isProduction);

        return true;
    } catch (error) {
        if (error.message?.includes('already exists')) {
            // Try unpublishing and republishing
            console.log('Version exists, trying to unpublish and republish...');
            await unpublishExtension(collection, version);
            return await publishExtension(collection, version);
        }
        console.error(`Failed to publish ${collection}:`, error instanceof Error ? error.message : String(error));
        return false;
    }
}

/**
 * Reset an extension to a specific version
 * @param {string} collection Extension collection name
 * @param {string} targetVersion Version to reset to
 * @returns {Promise<boolean>} Success status
 */
async function resetExtensionVersion(collection, targetVersion) {
    // Check current version
    const currentVersion = await getCurrentVersion(collection);
    
    // Validate version and prepare environment
    const validation = await validateAndPrepareVersion(targetVersion);
    if (!validation.valid) {
        throw new Error('Version validation failed:\n' + validation.errors.join('\n'));
    }

    // Additional validation for current version
    if (currentVersion && currentVersion === targetVersion) {
        console.log(`✨ ${collection} already at version ${targetVersion}, skipping...`);
        return true;
    }

    if (currentVersion === targetVersion) {
        console.log(`✨ ${collection} already at version ${targetVersion}, skipping...`);
        return true;
    }

    // Switch environment based on version pattern
    await switchEnvironmentForVersion(targetVersion);

    // First update package.json
    const updated = await updatePackageVersion(collection, targetVersion);
    if (!updated) return false;

    // Then unpublish current version if it exists
    if (currentVersion) {
        const unpublished = await unpublishExtension(collection);
        if (!unpublished) return false;
    }

    // Finally publish target version
    return await publishExtension(collection, targetVersion);
}

/**
 * Reset all extensions to a specific version
 * @param {string} [targetVersion] Version to reset to (optional, uses highest current version if not specified)
 * @returns {Promise<boolean>} Success status
 */
async function resetAllVersions(targetVersion) {
    // If no version specified, use highest current version
    if (!targetVersion) {
        targetVersion = await getHighestVersion();
        console.log(`Using highest current version: ${targetVersion}`);
    }

    let success = true;
    for (const collection of getCollections()) {
        const reset = await resetExtensionVersion(collection, targetVersion);
        if (!reset) success = false;
    }
    return success;
}

/**
 * Get next patch version (0.0.n)
 * @returns {Promise<string>} Next patch version
 */
async function getNextPatchVersion() {
    const highest = await getHighestVersion();
    const [major, minor, patch] = highest.split('.').map(Number);
    return `${major}.${minor}.${patch + 1}`;
}

/**
 * Get next minor version (0.n.0)
 * @returns {Promise<string>} Next minor version
 */
async function getNextMinorVersion() {
    const highest = await getHighestVersion();
    const [major, minor] = highest.split('.').map(Number);
    return `${major}.${minor + 2}.0`; // Skip odd numbers for production
}

/**
 * Get next major version (n.0.0)
 * @returns {Promise<string>} Next major version
 */
async function getNextMajorVersion() {
    const highest = await getHighestVersion();
    const [major] = highest.split('.').map(Number);
    return `${major + 1}.0.0`;
}

/**
 * Publish all extensions with same version
 * @param {string} version Version to publish
 * @returns {Promise<boolean>} Success status
 */
async function publishAllExtensions(version) {
    const collections = getCollections();
    let success = true;
    for (const collection of collections) {
        const published = await publishExtension(collection, version);
        if (!published) success = false;
    }
    return success;
}

export {
    getCurrentVersion,
    getHighestVersion,
    getCollections,
    resetExtensionVersion,
    resetAllVersions,
    isProductionVersion,
    isDevelopmentVersion,
    isMainVersion,
    switchEnvironmentForVersion,
    unpublishExtension,
    publishExtension,
    getVersionType,
    getNextPatchVersion,
    getNextMinorVersion,
    getNextMajorVersion,
    publishAllExtensions,
    validateAndPrepareVersion
};