#!/usr/bin/env node

// @ts-check
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import * as versionManager from './version-manager.js';
import * as environmentManager from './environment-manager.js';

// ES module dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

// Command modules
const commands = {
    remote: {
        description: 'Update git remote and environment',
        options: [
            { name: 'production', description: 'Use production environment', flag: true }
        ],
        action: async (args) => {
            await environmentManager.updateEnvironment(args.production);
            await environmentManager.updateGitRemote(args.production);
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
    publish: {
        description: 'Publish extensions with version management',
        options: [
            { name: 'dev', description: 'Auto-increment patch version (0.0.n)', flag: true },
            { name: 'prod', description: 'Auto-increment minor version (0.n.0)', flag: true },
            { name: 'main', description: 'Auto-increment major version (n.0.0)', flag: true },
            { name: 'version', description: 'Specific version to publish' },
            { name: 'package', description: 'Specific package to publish' }
        ],
        action: async (args) => {
            // Validate flags
            const flags = ['dev', 'prod', 'main'].filter(f => args[f]);
            if (flags.length > 1) {
                throw new Error('Only one version flag (--dev, --prod, --main) can be used');
            }
            if (flags.length === 0 && !args.version) {
                throw new Error('Must specify either a version flag or --version');
            }
            if (flags.length > 0 && args.version) {
                throw new Error('Cannot use both version flag and --version');
            }

            // Get target version
            let version = args.version;
            if (args.dev) {
                version = await versionManager.getNextPatchVersion();
            } else if (args.prod) {
                version = await versionManager.getNextMinorVersion();
            } else if (args.main) {
                version = await versionManager.getNextMajorVersion();
            }

            // Publish
            if (args.package) {
                console.log(`\n=== Publishing ${args.package} ${version} ===`);
                const success = await versionManager.publishExtension(args.package, version);
                if (success) {
                    console.log(`\n✨ ${args.package} published as ${version}`);
                } else {
                    console.error(`\n❌ Failed to publish ${args.package}`);
                    process.exit(1);
                }
            } else {
                console.log(`\n=== Publishing All Extensions ${version} ===`);
                const success = await versionManager.publishAllExtensions(version);
                if (success) {
                    console.log(`\n✨ All extensions published as ${version}`);
                } else {
                    console.error('\n❌ Failed to publish some extensions');
                    process.exit(1);
                }
            }
        }
    },
    versions: {
        description: 'Show all extension versions',
        options: [],
        action: async () => {
            console.log('\n=== Extension Versions ===\n');
            try {
                const collections = versionManager.getCollections();
                for (const collection of collections) {
                    const version = await versionManager.getCurrentVersion(collection);
                    console.log(`${collection}: ${version || 'Not published'}`);
                }
            } catch (error) {
                console.error('❌ Error showing versions:', error instanceof Error ? error.message : String(error));
                process.exit(1);
            }
        }
    },
    unpublish: {
        description: 'Unpublish extensions',
        options: [
            { name: 'version', description: 'Specific version to unpublish' },
            { name: 'package', description: 'Specific package to unpublish' }
        ],
        action: async (args) => {
            console.log('\n=== Unpublishing Extensions ===\n');
            const collections = args.package ? [args.package] : versionManager.getCollections();

            let success = true;
            for (const collection of collections) {
                const unpublished = await versionManager.unpublishExtension(collection, args.version || '');
                if (!unpublished) success = false;
            }

            if (success) {
                console.log('\n✨ All extensions unpublished successfully');
            } else {
                console.error('\n❌ Failed to unpublish some extensions');
                process.exit(1);
            }
        }
    }
};

// Help and argument parsing
function showHelp() {
    console.log(`
Usage: cli.js <command> [options]

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
  # Switch environments
  cli.js remote                  # Development (ih8sirdavi)
  cli.js remote --production     # Production (ihatesirdavi)

  # Version Management
  cli.js publish --dev           # Auto-increment patch (0.0.n)
  cli.js publish --prod          # Auto-increment minor (0.n.0)
  cli.js publish --main          # Auto-increment major (n.0.0)
  cli.js publish --version 0.1.0 # Specific version

  # Package Management
  cli.js publish --package core-dev-essentials --dev
  cli.js unpublish --package core-dev-essentials
  cli.js versions                # Show current versions
  cli.js cleanup --force         # Force cleanup
`);
}

function parseArgs() {
    const args = process.argv.slice(2);
    const command = args[0];
    const options = {};
    
    if (!command || command === '--help' || command === '-h') {
        showHelp();
        process.exit(command === '--help' || command === '-h' ? 0 : 1);
    }

    if (!commands[command]) {
        console.error(`Unknown command: ${command}`);
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

    return { command, options };
}

// Extension management
async function runCleanup(force = false) {
    console.log('\n=== Running Cleanup ===\n');
    try {
        execSync(`node ${path.join(__dirname, 'cleanup-extensions.js')}${force ? ' --force' : ''}`, { stdio: 'inherit' });
    } catch (error) {
        console.error('❌ Error running cleanup:', error instanceof Error ? error.message : String(error));
        process.exit(1);
    }
}

// Main
async function main() {
    try {
        const { command, options } = parseArgs();
        await commands[command].action(options);
    } catch (error) {
        console.error('❌ Error:', error instanceof Error ? error.message : String(error));
        process.exit(1);
    }
}

main();