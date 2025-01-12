#!/usr/bin/env node

/**
 * Interactive Extension Checker
 * Helps review extensions one by one and updates the checklist
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const CHECKLIST_PATH = path.join(__dirname, 'extension-checklist.md');
const PROGRESS_PATH = path.join(__dirname, 'review-progress.json');
const STATUSES = {
    KEEP: '✅',
    REVIEW: '⚠️',
    REMOVE: '❌'
};

// Categories for grouping extensions
const CATEGORIES = {
    PYTHON: ['python', 'pylance', 'jupyter', 'debugpy', 'ruff', 'arepl'],
    JAVA: ['java', 'gradle', 'maven', 'spring'],
    MARKDOWN: ['markdown', 'md'],
    GIT: ['git', 'github'],
    DATABASE: ['db', 'sql', 'mongo', 'redis'],
    REMOTE: ['remote', 'ssh', 'container', 'wsl'],
    WEB: ['tailwind', 'eslint', 'prettier', 'npm', 'svelte'],
    DOCKER: ['docker', 'kubernetes'],
    TESTING: ['test', 'playwright']
};

// Get list of installed extensions with details
function getExtensions() {
    return new Promise((resolve, reject) => {
        exec('code-insiders --list-extensions --show-versions', (error, stdout, stderr) => {
            if (error) {
                console.error(`Error: ${error.message}`);
                reject(error);
                return;
            }
            const extensions = stdout.trim().split('\n').map(ext => {
                const [id, version] = ext.split('@');
                return { id, version };
            });
            resolve(extensions);
        });
    });
}

// Categorize an extension
function categorizeExtension(extensionId) {
    for (const [category, keywords] of Object.entries(CATEGORIES)) {
        if (keywords.some(keyword => extensionId.toLowerCase().includes(keyword))) {
            return category;
        }
    }
    return 'OTHER';
}

// Load or initialize progress
function loadProgress() {
    try {
        if (fs.existsSync(PROGRESS_PATH)) {
            return JSON.parse(fs.readFileSync(PROGRESS_PATH, 'utf8'));
        }
    } catch (error) {
        console.error('Error loading progress:', error);
    }
    return { reviewed: [], decisions: {} };
}

// Save progress
function saveProgress(progress) {
    fs.writeFileSync(PROGRESS_PATH, JSON.stringify(progress, null, 2));
}

// Update checklist markdown file
function updateChecklist(extension, status, notes, category) {
    let content = fs.readFileSync(CHECKLIST_PATH, 'utf8');
    const lines = content.split('\n');
    
    // Find the section for this category
    const categoryStart = lines.findIndex(line => line.includes(`## ${category}`));
    if (categoryStart === -1) {
        // Add new category section if it doesn't exist
        lines.push(`\n## ${category}\n\n| Status | Extension | Purpose | Your Usage Notes |\n|--------|-----------|---------|------------------|\n`);
    }
    
    // Find or create the line for this extension
    const extensionLine = lines.findIndex(line => line.includes(extension));
    const newLine = `| ${status} | ${extension} | ${getExtensionPurpose(extension)} | ${notes} |`;
    
    if (extensionLine === -1) {
        // Add new line in appropriate category section
        const categoryEnd = lines.slice(categoryStart + 1).findIndex(line => line.startsWith('#')) + categoryStart + 1;
        lines.splice(categoryEnd === -1 ? lines.length : categoryEnd, 0, newLine);
    } else {
        // Update existing line
        lines[extensionLine] = newLine;
    }
    
    fs.writeFileSync(CHECKLIST_PATH, lines.join('\n'));
}

// Get a basic purpose description for an extension
function getExtensionPurpose(extensionId) {
    const parts = extensionId.split('.');
    const name = parts[parts.length - 1]
        .replace(/-/g, ' ')
        .replace(/([A-Z])/g, ' $1')
        .toLowerCase();
    return name.charAt(0).toUpperCase() + name.slice(1);
}

// Process one extension
async function processExtension(extension, progress) {
    return new Promise((resolve) => {
        const category = categorizeExtension(extension.id);
        console.log(`\nReviewing: ${extension.id} (${category})`);
        console.log(`Version: ${extension.version}`);
        
        if (progress.decisions[extension.id]) {
            console.log(`Previous decision: ${progress.decisions[extension.id].status}`);
            console.log(`Previous notes: ${progress.decisions[extension.id].notes}`);
        }
        
        rl.question(`
Do you actively use this extension?
1) ✅ Yes, keep it
2) ⚠️ Need to review
3) ❌ No, remove it
4) Skip for now
Choose (1-4): `, (answer) => {
            if (answer === '4') {
                resolve();
                return;
            }
            
            let status;
            switch(answer) {
                case '1':
                    status = STATUSES.KEEP;
                    break;
                case '2':
                    status = STATUSES.REVIEW;
                    break;
                case '3':
                    status = STATUSES.REMOVE;
                    break;
                default:
                    status = STATUSES.REVIEW;
            }
            
            rl.question('Add notes about usage (optional): ', (notes) => {
                progress.reviewed.push(extension.id);
                progress.decisions[extension.id] = { status, notes, category };
                saveProgress(progress);
                updateChecklist(extension.id, status, notes, category);
                resolve();
            });
        });
    });
}

// Main process
async function main() {
    try {
        const extensions = await getExtensions();
        const progress = loadProgress();
        
        console.log(`Found ${extensions.length} extensions to review.`);
        console.log(`Previously reviewed: ${progress.reviewed.length}`);
        
        // Group extensions by category
        const byCategory = extensions.reduce((acc, ext) => {
            const category = categorizeExtension(ext.id);
            if (!acc[category]) acc[category] = [];
            acc[category].push(ext);
            return acc;
        }, {});
        
        // Show category summary
        console.log('\nExtensions by category:');
        Object.entries(byCategory).forEach(([category, exts]) => {
            console.log(`${category}: ${exts.length} extensions`);
        });
        
        // Ask which category to review
        const categories = Object.keys(byCategory);
        console.log('\nWhich category would you like to review?');
        categories.forEach((cat, i) => {
            console.log(`${i + 1}) ${cat} (${byCategory[cat].length} extensions)`);
        });
        
        rl.question('Choose category number (or "all" for all extensions): ', async (answer) => {
            let extensionsToReview;
            if (answer.toLowerCase() === 'all') {
                extensionsToReview = extensions;
            } else {
                const categoryIndex = parseInt(answer) - 1;
                if (categoryIndex >= 0 && categoryIndex < categories.length) {
                    extensionsToReview = byCategory[categories[categoryIndex]];
                } else {
                    console.log('Invalid category. Exiting.');
                    rl.close();
                    return;
                }
            }
            
            for (const ext of extensionsToReview) {
                await processExtension(ext, progress);
            }
            
            console.log('\nReview complete! Checklist has been updated.');
            console.log(`Progress saved to: ${PROGRESS_PATH}`);
            rl.close();
        });
    } catch (error) {
        console.error('Error:', error);
        rl.close();
    }
}

// Start the review process
console.log(`
Extension Review Process
-----------------------
This script will help you review your VS Code extensions one by one.
Extensions are grouped by category for easier review.
Progress is saved automatically and can be resumed later.

Press Enter to start...
`);

rl.question('', () => {
    main().catch(console.error);
});