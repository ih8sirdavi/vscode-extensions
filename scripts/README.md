# VS Code Extension Collection Scripts

Automation scripts for managing VS Code extension collections.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Ensure VS Code or a compatible fork is in your PATH

## Available Scripts

### 1. Cleanup Extensions
Removes redundant or replaced extensions:

```bash
npm run cleanup
```

This will:
- Remove duplicate extension packs
- Remove replaced tools (e.g., autopep8/flake8 replaced by ruff)
- Clean up unused database extensions

### 2. Create Collections
Creates or updates all extension collections:

```bash
npm run create
```

This will:
- Create/update collection directories
- Generate package.json files
- Create documentation
- Package collections into .vsix files

### 3. Package All Collections
Creates .vsix files for all collections:

```bash
npm run package-all
```

### 4. Publish All Collections
Publishes all collections to the marketplace:

```bash
npm run publish-all
```

### 5. Test All Collections
Installs all collections locally for testing:

```bash
npm run test-all
```

## Collection Structure

Each collection is created with:
- package.json (extension metadata)
- README.md (documentation)
- CHANGELOG.md (version history)
- LICENSE (MIT)

## Troubleshooting

1. VS Code Not Found
   - Ensure VS Code is installed
   - Add VS Code to your system PATH
   - See [VS Code Setup Guide](../docs/setup-vscode-path.md)

2. Publishing Errors
   - Verify publisher ID is set
   - Check Personal Access Token
   - Ensure version numbers are incremented

3. Script Errors
   - Check Node.js is installed
   - Verify all dependencies are installed
   - Ensure you're running scripts from the scripts directory

## Contributing

1. Update collection definitions in create-collections.js
2. Test changes locally
3. Update documentation
4. Submit a pull request

## License

MIT - see [LICENSE](../LICENSE)