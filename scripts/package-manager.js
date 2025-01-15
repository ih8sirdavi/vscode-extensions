// @ts-check
import { execSync } from 'child_process';

/**
 * Execute a package manager command
 * @param {string} command Command to execute
 * @param {import('child_process').ExecSyncOptions} [options] Command options
 * @returns {string} Command output
 */
function execCommand(command, options = {}) {
    try {
        // Try global vsce first
        execSync(`vsce ${command}`, { stdio: 'inherit', ...options });
        return '';
    } catch (error) {
        try {
            // Fallback to npx
            execSync(`npx @vscode/vsce ${command}`, { stdio: 'inherit', ...options });
            return '';
        } catch (npxError) {
            throw new Error(
                'Failed to execute vsce command:\n' +
                `Global error: ${error instanceof Error ? error.message : String(error)}\n` +
                `Npx error: ${npxError instanceof Error ? npxError.message : String(npxError)}`
            );
        }
    }
}

export { execCommand };