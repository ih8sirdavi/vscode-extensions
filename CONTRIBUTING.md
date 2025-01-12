# Contributing to VS Code Extension Collections

## Prerequisites

1. Node.js and npm/pnpm installed
2. VSCE (Visual Studio Code Extension Manager) installed globally:
   ```bash
   npm install -g @vscode/vsce
   # or
   pnpm add -g @vscode/vsce
   ```
3. Visual Studio Code
4. Azure DevOps account for publishing

## Development Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/ih8sirdavi/vscode-extensions.git
   cd vscode-extensions
   ```

2. Install dependencies:
   ```bash
   # Using pnpm (preferred)
   pnpm install

   # Using npm (fallback)
   npm install
   ```

## Package Manager Support

The repository supports both pnpm (preferred) and npm:

- All commands have pnpm and npm variants
- pnpm is tried first, falling back to npm
- Workspace management works with both package managers

Example commands:
```bash
# Using pnpm
pnpm run package-all:pnpm

# Using npm
npm run package-all:npm

# Automatic (tries pnpm, falls back to npm)
npm run package-all
```

## Creating a New Collection

1. Create collection directory:
   ```bash
   mkdir collections/your-collection-name
   cd collections/your-collection-name
   ```

2. Configure package.json:
   ```json
   {
     "name": "your-collection-name",
     "displayName": "Your Collection Display Name",
     "description": "Description of your collection",
     "version": "0.0.1",
     "publisher": "ih8sirdavi",
     "engines": {
       "vscode": "^1.70.0"
     },
     "categories": ["Extension Packs"],
     "extensionPack": [
       "publisher1.extension1",
       "publisher2.extension2"
     ],
     "scripts": {
       "package": "vsce package --allow-missing-repository",
       "publish": "vsce publish --allow-missing-repository",
       "test": "code --install-extension *.vsix"
     }
   }
   ```

3. Add required files:
   - README.md (documentation)
   - CHANGELOG.md (version history)
   - .vscodeignore (build exclusions)

4. Update root package.json:
   - Add to workspaces array
   - Add to extensionPack array

## Publishing Process

### First-time Setup

1. Create Azure DevOps Organization
   - Visit [Azure DevOps](https://dev.azure.com)
   - Create new organization if needed

2. Generate Personal Access Token (PAT)
   - Go to User Settings > Personal access tokens
   - Create new token with "Marketplace (Manage)" scope
   - Save token securely

3. Create Publisher
   - Visit [VS Marketplace Publisher Management](https://marketplace.visualstudio.com/manage)
   - Click "Create Publisher"
   - Fill required information

### Publishing Collections

1. Package collections:
   ```bash
   pnpm run package-all
   ```

2. Test locally:
   ```bash
   pnpm run test-all
   ```

3. Publish:
   ```bash
   pnpm run publish-all
   ```

## Maintenance

### Version Updates

1. Update version in collection's package.json
2. Update CHANGELOG.md
3. Republish collection

### Extension Updates

1. Review included extensions monthly
2. Test compatibility with latest VS Code
3. Update extension lists
4. Document changes

## Best Practices

1. Keep collections focused and purposeful
2. Document all included extensions
3. Test thoroughly before publishing
4. Maintain clear changelogs
5. Respond to user feedback
6. Regular updates and maintenance

## Troubleshooting

Common issues and solutions:

1. Publishing Errors
   - Verify PAT is valid and has correct scope
   - Check package.json format
   - Ensure unique extension/publisher name

2. Installation Issues
   - Check VS Code version compatibility
   - Verify all extensions are available
   - Check for conflicts

3. Update Problems
   - Clear VS Code extension cache
   - Reinstall extension pack
   - Check extension compatibility