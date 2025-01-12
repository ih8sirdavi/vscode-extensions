#!/usr/bin/env node

// @ts-check
'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Package manager detection
function detectPackageManager() {
    if (process.env.npm_config_user_agent?.startsWith('pnpm')) {
        return 'pnpm';
    }
    try {
        execSync('pnpm --version', { stdio: 'ignore' });
        return 'pnpm';
    } catch {
        return 'npm';
    }
}

const packageManager = detectPackageManager();

// Command modules
const commands = {
    publish: {
        description: 'Publish extensions',
        options: [
            { name: 'version', description: 'Version to publish', required: true },
            { name: 'force', description: 'Force publish without confirmation', flag: true }
        ],
        action: async (args) => {
            const { version, force } = args;
            await updateVersions(version);
            await runCleanup();
            await publishPackages(version, force);
        }
    },
    cleanup: {
        description: 'Clean and manage extensions',
        options: [
            { name: 'force', description: 'Force cleanup without confirmation', flag: true }
        ],
        action: async (args) => {
            await runCleanup(args.force);
        }
    },
    remote: {
        description: 'Update git remote',
        options: [
            { name: 'production', description: 'Use production remote', flag: true }
        ],
        action: async (args) => {
            await updateGitRemote(args.production);
        }
    }
};

// Utility functions
function parseArgs() {
    const args = process.argv.slice(2);
    const command = args[0];
    const options = {};
    
    if (!command || !commands[command]) {
        showHelp();
        process.exit(1);
    }

    const cmdOptions = commands[command].options || [];
    let i = 1;
    while (i < args.length) {
        const arg = args[i];
        if (arg.startsWith('--')) {
            const name = arg.slice(2);
            const option = cmdOptions.find(opt => opt.name === name);
            if (!option) {
                console.error(`Unknown option: ${arg}`);
                process.exit(1);
            }
            if (option.flag) {
                options[name] = true;
                i++;
            } else {
                options[name] = args[i + 1];
                i += 2;
            }
        } else {
            i++;
        }
    }

    // Validate required options
    cmdOptions.forEach(opt => {
        if (opt.required && !options[opt.name]) {
            console.error(`Missing required option: --${opt.name}`);
            process.exit(1);
        }
    });

    return { command, options };
}

function showHelp() {
    console.log(`
Usage: cli.js <command> [options]

Package Manager: ${packageManager} (with npm fallback)

Commands:`);
    
    Object.entries(commands).forEach(([name, cmd]) => {
        console.log(`\n  ${name.padEnd(12)}${cmd.description}`);
        if (cmd.options) {
            cmd.options.forEach(opt => {
                const required = opt.required ? ' (required)' : '';
                console.log(`    --${opt.name.padEnd(12)}${opt.description}${required}`);
            });
        }
    });

    console.log(`\nExamples:
  # Publish a new version
  cli.js publish --version 0.3.0

  # Force cleanup
  cli.js cleanup --force

  # Switch to production remote
  cli.js remote --production

Package Manager Commands:
  pnpm run <command>     # Use pnpm (preferred)
  npm run <command>      # Use npm (fallback)
`);
}

// Version management
async function updateVersions(version) {
    const packages = [
        'core-dev-essentials/package.json',
        'python-dev-essentials/package.json',
        'documentation-essentials/package.json',
        'package.json'
    ];

    console.log(`\n=== Updating Versions to ${version} ===\n`);
    
    packages.forEach(pkgPath => {
        const fullPath = path.join(__dirname, '..', pkgPath);
        try {
            const pkg = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
            
            const publisher = process.env.VSCODE_PUBLISHER;
            const githubOrg = process.env.GITHUB_ORG;
            if (!publisher) {
                throw new Error('VSCODE_PUBLISHER not set in .env');
            }
            if (!githubOrg) {
                throw new Error('GITHUB_ORG not set in .env');
            }

            // Update version and publisher
            pkg.version = version;
            pkg.publisher = publisher;

            // Update repository URL
            pkg.repository.url = `https://github.com/${githubOrg}/vscode-extensions.git`;

            // Update extensionPack references if present
            if (pkg.extensionPack) {
                pkg.extensionPack = pkg.extensionPack.map(ext => {
                    // If it's a template string, replace the publisher
                    if (ext.includes('${publisher}')) {
                        return ext.replace('${publisher}', publisher);
                    }
                    // If it has a publisher prefix, replace it
                    const parts = ext.split('.');
                    if (parts.length > 1) {
                        return `${publisher}.${parts[1]}`;
                    }
                    return ext;
                });
            }
            
            fs.writeFileSync(fullPath, JSON.stringify(pkg, null, 2) + '\n');
            console.log(`✅ Updated ${pkgPath} (version: ${version}, publisher: ${publisher})`);
        } catch (error) {
            console.error(`❌ Error updating ${pkgPath}:`, error.message);
            process.exit(1);
        }
    });
}

// Load environment variables
require('dotenv').config();

// Git and publisher management
async function updateGitRemote(isProduction) {
    // Update .env file
    const envContent = isProduction
        ? `VSCODE_PUBLISHER=ihatesirdavi\nGITHUB_ORG=sirdavi-portfolio\nGITHUB_REPO=vscode-extensions`
        : `VSCODE_PUBLISHER=ih8sirdavi\nGITHUB_ORG=ih8sirdavi\nGITHUB_REPO=vscode-extensions`;
    
    fs.writeFileSync(path.join(__dirname, '..', '.env'), envContent);
    console.log(`✅ Updated .env for ${isProduction ? 'production' : 'development'}`);

    // Configure git
    const config = isProduction
        ? {
            remote: 'https://github.com/sirdavi-portfolio/vscode-extensions.git',
            branch: 'production',
            name: 'Production',
            publisher: 'ihatesirdavi'
        }
        : {
            remote: 'https://github.com/ih8sirdavi/vscode-extensions.git',
            branch: 'main',
            name: 'Development',
            publisher: 'ih8sirdavi'
        };

    try {
        // Update remote
        execSync('git remote -v', { stdio: 'pipe' });
        execSync(`git remote set-url origin ${config.remote}`, { stdio: 'inherit' });
        console.log(`✅ Updated git remote to ${config.remote}`);

        // Check git status
        const status = execSync('git status --porcelain', { encoding: 'utf8' });
        if (status) {
            console.error('❌ You have uncommitted changes. Please commit or stash them first.');
            process.exit(1);
        }

        // Check if branch exists
        const branches = execSync('git branch', { encoding: 'utf8' });
        const branchExists = branches.includes(config.branch);

        // Switch or create branch
        if (branchExists) {
            execSync(`git checkout ${config.branch}`, { stdio: 'inherit' });
            console.log(`✅ Switched to ${config.branch} branch`);
        } else {
            execSync(`git checkout -b ${config.branch}`, { stdio: 'inherit' });
            console.log(`✅ Created and switched to ${config.branch} branch`);
        }

        // Pull latest changes
        try {
            execSync(`git pull origin ${config.branch}`, { stdio: 'inherit' });
            console.log(`✅ Pulled latest changes from ${config.branch}`);
        } catch (error) {
            console.log(`⚠️ No remote branch ${config.branch} found yet`);
        }

        console.log(`\n✨ Now using ${config.name} environment (${config.branch} branch)`);
    } catch (error) {
        console.error('❌ Error updating git configuration:', error.message);
        process.exit(1);
    }
}

// Extension management
async function runCleanup(force = false) {
    console.log('\n=== Running Cleanup ===\n');
    try {
        execSync(`node ${path.join(__dirname, 'cleanup-extensions.js')}${force ? ' --force' : ''}`, { stdio: 'inherit' });
    } catch (error) {
        console.error('❌ Error running cleanup:', error.message);
        process.exit(1);
    }
}

// Publishing
async function publishPackages(version, force = false) {
    console.log('\n=== Publishing Packages ===\n');

    // Load publisher from environment
    const publisher = process.env.VSCODE_PUBLISHER;
    if (!publisher) {
        console.error('❌ VSCODE_PUBLISHER not set in .env');
        process.exit(1);
    }

    const extensions = [
        `${publisher}.core-dev-essentials`,
        `${publisher}.python-dev-essentials`,
        `${publisher}.documentation-essentials`,
        `${publisher}.vscode-master-collection`
    ];

    try {
        // Check existing versions
        extensions.forEach(ext => {
            try {
                const result = execSync(`vsce show ${ext} ${version}`, { stdio: 'pipe' });
                if (result.toString().includes(version) && !force) {
                    console.error(`Version ${version} already exists for ${ext}`);
                    console.log('Use --force to override');
                    process.exit(1);
                }
            } catch (error) {
                // Version doesn't exist, continue
            }
        });

        // Publish all packages using detected package manager
        const publishCmd = packageManager === 'pnpm'
            ? 'pnpm -r exec vsce publish --allow-missing-repository'
            : 'npm run publish --workspaces';
        try {
            execSync(publishCmd, { stdio: 'inherit' });
        } catch (error) {
            if (packageManager === 'pnpm') {
                console.log('⚠️ pnpm publish failed, falling back to npm...');
                execSync('npm run publish --workspaces', { stdio: 'inherit' });
            } else {
                throw error;
            }
        }
        console.log('\n✨ Successfully published all packages!\n');
    } catch (error) {
        console.error('❌ Error publishing packages:', error.message);
        process.exit(1);
    }
}

// Main
async function main() {
    try {
        const { command, options } = parseArgs();
        await commands[command].action(options);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

main();