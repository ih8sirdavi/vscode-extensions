#!/usr/bin/env node

const { execSync } = require('child_process');

function detectPackageManager() {
    // Check if running under pnpm
    if (process.env.npm_config_user_agent?.startsWith('pnpm')) {
        return 'pnpm';
    }

    // Check if pnpm is installed
    try {
        execSync('pnpm --version', { stdio: 'ignore' });
        return 'pnpm';
    } catch {
        // If pnpm is not found, default to npm
        return 'npm';
    }
}

function main() {
    const packageManager = detectPackageManager();
    
    console.log(`
Package Manager Detection
========================
Using: ${packageManager}

Commands will be executed using ${packageManager} with fallback to npm.
To explicitly use a specific package manager, run commands with the suffix:

pnpm:
  pnpm run <command>:pnpm

npm:
  npm run <command>:npm

Example:
  ${packageManager} run package-all:${packageManager}

All commands will attempt pnpm first, then fall back to npm if pnpm is not available.
`);
}

main();