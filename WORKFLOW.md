# Project Workflow

## Repository Organization

### GitHub Organization
- Organization: sirdavi-portfolio
- Main repository: vscode-extensions
- Branch strategy:
  - main: Production releases (ihatesirdavi)
  - dev: Development work (ih8sirdavi)

### Publisher Configuration
The project uses environment variables to switch between development and production publishers:
```bash
# .env file
VSCODE_PUBLISHER=ih8sirdavi    # Development
#VSCODE_PUBLISHER=ihatesirdavi # Production
```

To switch publishers:
1. Edit .env file to set desired publisher
2. Run `pnpm run update-publisher`
3. Verify changes
4. Commit and publish

## Development Flow

### Initial Development (ih8sirdavi)
1. Work on dev branch
2. Test changes locally
3. Publish to marketplace under ih8sirdavi
4. Verify functionality

### Production Release (ihatesirdavi)
1. Merge dev into main
2. Switch publisher to ihatesirdavi
3. Publish to marketplace
4. Tag release

## Version Management
- All versions start at 0.0.0
- Version numbers synchronized between branches
- Increment only when instructed

## Extension Collections

### Core Development Essentials
- EditorConfig
- GitHub integration
- Project management
- Docker/Kubernetes (disabled by default)

### Python Development Essentials
- Python language support
- Debugging tools
- Jupyter notebooks (disabled by default)
- Code quality tools

### Documentation Essentials
- Markdown support
- Preview features
- Diagram tools

## Extension Management

### Cleanup Script
- Removes unnecessary extensions
- Preserves collection extensions
- Handles disabled states via settings.json

### Publisher Script
- Updates all package.json files
- Maintains consistent repository links
- Switches between publishers

## Best Practices

### Development
1. Always work on dev branch
2. Test thoroughly before publishing
3. Use cleanup script for testing
4. Verify disabled extensions work when enabled

### Publishing
1. Ensure correct publisher is set
2. Run update-publisher if needed
3. Test before publishing
4. Document changes in CHANGELOG.md

### Repository Management
1. Keep dev branch local
2. Merge to main for production
3. Tag releases appropriately
4. Maintain clean commit history

## Scripts

### Package Management
```bash
pnpm install          # Install dependencies
pnpm run package-all  # Package all extensions
pnpm run publish-all  # Publish all extensions
```

### Utility Scripts
```bash
pnpm run cleanup           # Clean up extensions
pnpm run update-publisher  # Switch publishers
```

### Testing
```bash
pnpm run test-all     # Test all extensions
```

## Documentation
- README.md: Main documentation
- CHANGELOG.md: Version history
- WORKFLOW.md: Development process
- CONTRIBUTING.md: Contribution guidelines