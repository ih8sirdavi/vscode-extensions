#!/usr/bin/env node

// @ts-check
'use strict';

// Script to create VS Code extension collections
const fs = require('fs');
const path = require('path');
const { execSync, spawnSync } = require('child_process');

// Try different VS Code commands to find which one works
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
            continue;
        }
    }

    throw new Error('No VS Code installation found. Please ensure VS Code or a fork is installed and in your PATH.');
}

// Collection definitions
const collections = {
    'core-dev-essentials': {
        displayName: 'Core Development Essentials',
        description: 'Essential extensions for core development tasks',
        extensions: [
            'editorconfig.editorconfig',
            'github.vscode-pull-request-github',
            'github.vscode-github-actions',
            'alefragnani.project-manager',
            'gruntfuggly.todo-tree'
        ],
        keywords: ['core', 'development', 'productivity', 'git', 'project management']
    },
    'python-dev-essentials': {
        displayName: 'Python Development Essentials',
        description: 'Essential extensions for Python development',
        extensions: [
            'ms-python.python',
            'ms-python.pylance',
            'ms-python.debugpy',
            'charliermarsh.ruff',
            'ms-toolsai.jupyter',
            'njpwerner.autodocstring',
            'njqdev.vscode-python-typehint'
        ],
        keywords: ['python', 'development', 'jupyter', 'debugging', 'linting']
    },
    'documentation-essentials': {
        displayName: 'Documentation Essentials',
        description: 'Essential extensions for documentation and markdown',
        extensions: [
            'yzhang.markdown-all-in-one',
            'shd101wyy.markdown-preview-enhanced',
            'bierner.markdown-mermaid',
            'bierner.markdown-emoji',
            'bierner.markdown-footnotes'
        ],
        keywords: ['markdown', 'documentation', 'preview', 'diagrams', 'writing']
    }
};

/**
 * Creates a collection with the given name and configuration
 * @param {string} name The name of the collection
 * @param {object} config The collection configuration
 */
function createCollection(name, config) {
    const collectionDir = path.join(process.cwd(), '..', name);
    
    // Create directory
    if (!fs.existsSync(collectionDir)) {
        fs.mkdirSync(collectionDir);
    }

    // Create package.json
    const packageJson = {
        name: name,
        displayName: config.displayName,
        description: config.description,
        version: '0.0.2',
        publisher: 'ih8sirdavi',
        repository: {
            type: 'git',
            url: 'https://github.com/ih8sirdavi/vscode-extensions.git',
            directory: name
        },
        engines: {
            vscode: '^1.70.0'
        },
        categories: ['Extension Packs'],
        extensionPack: config.extensions,
        license: 'MIT',
        keywords: config.keywords,
        homepage: `https://github.com/ih8sirdavi/vscode-extensions/tree/main/${name}#readme`,
        bugs: {
            url: 'https://github.com/ih8sirdavi/vscode-extensions/issues'
        }
    };

    fs.writeFileSync(
        path.join(collectionDir, 'package.json'),
        JSON.stringify(packageJson, null, 2)
    );

    // Create README.md
    const readme = `# ${config.displayName}

${config.description}

## Features

${config.keywords.map(k => `- ${k.charAt(0).toUpperCase() + k.slice(1)}`).join('\n')}

## Included Extensions

${config.extensions.map(ext => `- ${ext}`).join('\n')}

## Installation

This extension pack works with VS Code and compatible forks (VS Code Insiders, VS Codium, etc).

Search for "${config.displayName}" in your editor's extensions marketplace.

Or install via CLI:
\`\`\`bash
# VS Code
code --install-extension ih8sirdavi.${name}

# VS Code Insiders
code-insiders --install-extension ih8sirdavi.${name}

# VS Codium
codium --install-extension ih8sirdavi.${name}

# VS Code OSS
code-oss --install-extension ih8sirdavi.${name}
\`\`\``;

    fs.writeFileSync(
        path.join(collectionDir, 'README.md'),
        readme
    );

    // Create CHANGELOG.md
    const changelog = `# Change Log

## [0.0.2]
- Updated metadata and documentation
- Improved compatibility with VS Code forks
- Added keywords for better discoverability
${name === 'python-dev-essentials' ? '- Verified Jupyter integration' : ''}
${name === 'documentation-essentials' ? '- Enhanced Mermaid diagram support' : ''}

## [0.0.1]
- Initial release
- Added core extensions for ${name}
- Verified compatibility with VS Code and forks`;

    fs.writeFileSync(
        path.join(collectionDir, 'CHANGELOG.md'),
        changelog
    );

    // Copy LICENSE file if it doesn't exist
    const licensePath = path.join(collectionDir, 'LICENSE');
    if (!fs.existsSync(licensePath)) {
        const licenseContent = `MIT License

Copyright (c) 2025 ih8sirdavi

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.`;
        fs.writeFileSync(licensePath, licenseContent);
    }

    console.log(`Created collection: ${name}`);
}

/**
 * Package a collection using vsce
 * @param {string} name The name of the collection
 */
function packageCollection(name) {
    try {
        console.log(`Packaging ${name}...`);
        execSync(`cd ../${name} && vsce package --allow-missing-repository`, { stdio: 'inherit' });
        console.log(`✅ Successfully packaged ${name}\n`);
        return true;
    } catch (error) {
        console.error(`❌ Error packaging ${name}: ${error.message}\n`);
        return false;
    }
}

// Create and package collections
async function main() {
    console.log('Creating extension collections...\n');

    // Create and package each collection
    for (const [name, config] of Object.entries(collections)) {
        try {
            createCollection(name, config);
            console.log(`✅ Successfully created ${name}\n`);
            
            if (packageCollection(name)) {
                console.log(`✅ Collection ${name} is ready for testing\n`);
            }
        } catch (error) {
            console.error(`❌ Error processing ${name}: ${error.message}\n`);
        }
    }

    console.log('Collection creation complete!\n');
    console.log('Next steps:');
    console.log('1. Review the created collections');
    console.log('2. Test locally with one of these commands:');
    console.log('   code --install-extension <collection>/<collection>-0.0.2.vsix');
    console.log('   code-insiders --install-extension <collection>/<collection>-0.0.2.vsix');
    console.log('   codium --install-extension <collection>/<collection>-0.0.2.vsix');
    console.log('3. Run "vsce publish --allow-missing-repository" in each collection directory to publish');
}

// Run the script
main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});