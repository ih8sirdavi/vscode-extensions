// @ts-check
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// ES module dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Update environment configuration
 * @param {boolean} isProduction Whether to use production environment
 */
async function updateEnvironment(isProduction) {
    const envPath = path.join(__dirname, '..', '.env');
    const envContent = fs.readFileSync(envPath, 'utf8');
    
    // Parse current .env content
    const envLines = envContent.split('\n');
    const updatedLines = envLines.map(line => {
        // Keep configuration sections
        if (line.startsWith('#') || line.trim() === '' || 
            line.startsWith('DEV_') || line.startsWith('PROD_')) {
            return line;
        }
        
        // Update active configuration
        if (line.startsWith('VSCODE_PUBLISHER=')) {
            return `VSCODE_PUBLISHER=${isProduction ? process.env.PROD_PUBLISHER : process.env.DEV_PUBLISHER}`;
        }
        if (line.startsWith('GITHUB_ORG=')) {
            return `GITHUB_ORG=${isProduction ? process.env.PROD_GITHUB_ORG : process.env.DEV_GITHUB_ORG}`;
        }
        if (line.startsWith('GITHUB_REPO=')) {
            return `GITHUB_REPO=${isProduction ? process.env.PROD_GITHUB_REPO : process.env.DEV_GITHUB_REPO}`;
        }
        return line;
    });

    fs.writeFileSync(envPath, updatedLines.join('\n'));
    console.log(`✅ Updated .env for ${isProduction ? 'production' : 'development'}`);
    
    // Reload environment variables
    dotenv.config({ override: true });
    console.log(`✅ Publisher set to ${process.env.VSCODE_PUBLISHER}`);
}

/**
 * Update git remote configuration
 * @param {boolean} isProduction Whether to use production environment
 * @param {string} [version] Version being published (for commit message)
 */
async function updateGitRemote(isProduction, version) {
    const config = isProduction
        ? {
            remote: 'https://github.com/sirdavi-portfolio/vscode-extensions.git',
            branch: 'production',
            name: 'Production'
        }
        : {
            remote: 'https://github.com/ih8sirdavi/vscode-extensions.git',
            branch: 'dev',
            name: 'Development'
        };

    try {
        // Update remote
        execSync('git remote -v', { stdio: 'pipe' });
        execSync(`git remote set-url origin ${config.remote}`, { stdio: 'inherit' });
        console.log(`✅ Updated git remote to ${config.remote}`);

        // Check git status
        const status = execSync('git status --porcelain', { encoding: 'utf8' });
        if (status) {
            // Stash changes if any
            console.log('Stashing changes...');
            execSync('git stash push', { stdio: 'inherit' });
        }

        // Switch or create branch
        const branches = execSync('git branch', { encoding: 'utf8' });
        const branchExists = branches.includes(config.branch);

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

        // Pop stashed changes if any
        if (status) {
            console.log('Restoring stashed changes...');
            execSync('git stash pop', { stdio: 'inherit' });
        }

        console.log(`\n✨ Now using ${config.name} environment (${config.branch} branch)`);
    } catch (error) {
        console.error('❌ Error updating git configuration:', error instanceof Error ? error.message : String(error));
        throw error;
    }
}

/**
 * Commit version changes
 * @param {string} version Version being published
 * @param {boolean} isProduction Whether this is a production version
 * @returns {Promise<boolean>} Whether changes were committed
 */
async function commitVersionChanges(version, isProduction) {
    try {
        // Check if there are changes
        const gitStatus = execSync('git status --porcelain', { encoding: 'utf8' });
        if (gitStatus) {
            // Add package.json files
            execSync('git add "**/package.json"', { stdio: 'inherit' });

            // Force add .env if it exists and has changes
            const envChanges = execSync('git status --porcelain .env', { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
            if (envChanges) {
                execSync('git add -f .env', { stdio: 'inherit' });
            }

            // Create commit message based on version type
            const type = isProduction ? 'release' : 'dev';
            const message = `chore(${type}): publish version ${version}`;
            execSync(`git commit -m "${message}"`, { stdio: 'inherit' });
            console.log(`✅ Committed version changes: ${message}`);

            // Push changes
            execSync(`git push origin HEAD`, { stdio: 'inherit' });
            console.log('✅ Pushed changes to remote');

            return true;
        } else {
            console.log('No changes to commit');
            return false;
        }
    } catch (error) {
        if (error.message?.includes('nothing to commit')) {
            return false;
        }
        console.error('❌ Error committing changes:', error instanceof Error ? error.message : String(error));
        throw error;
    }
}

export {
    updateEnvironment,
    updateGitRemote,
    commitVersionChanges
};