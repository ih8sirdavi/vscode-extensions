# VS Code Extension Collections

A comprehensive suite of VS Code extension collections for different development scenarios. Each collection is carefully curated to provide the best tools for specific development tasks. When installed, collections automatically install their required extensions to provide a complete development environment.

## Collections

### 1. Core Development Essentials
[![Version](https://img.shields.io/visual-studio-marketplace/v/ih8sirdavi.core-dev-essentials)](https://marketplace.visualstudio.com/items?itemName=ih8sirdavi.core-dev-essentials)
[![Installs](https://img.shields.io/visual-studio-marketplace/i/ih8sirdavi.core-dev-essentials)](https://marketplace.visualstudio.com/items?itemName=ih8sirdavi.core-dev-essentials)

Essential tools for any development workflow:
- EditorConfig support
- GitHub integration (Pull Requests, Actions)
- Project management
- Task tracking

[View Details](core-dev-essentials/README.md)

### 2. Python Development Essentials
[![Version](https://img.shields.io/visual-studio-marketplace/v/ih8sirdavi.python-dev-essentials)](https://marketplace.visualstudio.com/items?itemName=ih8sirdavi.python-dev-essentials)
[![Installs](https://img.shields.io/visual-studio-marketplace/i/ih8sirdavi.python-dev-essentials)](https://marketplace.visualstudio.com/items?itemName=ih8sirdavi.python-dev-essentials)

Complete Python development environment:
- Python language support
- Jupyter integration
- Modern linting with Ruff
- Debugging capabilities
- Type hint support
- Auto-documentation

[View Details](python-dev-essentials/README.md)

### 3. Documentation Essentials
[![Version](https://img.shields.io/visual-studio-marketplace/v/ih8sirdavi.documentation-essentials)](https://marketplace.visualstudio.com/items?itemName=ih8sirdavi.documentation-essentials)
[![Installs](https://img.shields.io/visual-studio-marketplace/i/ih8sirdavi.documentation-essentials)](https://marketplace.visualstudio.com/items?itemName=ih8sirdavi.documentation-essentials)

Tools for documentation and technical writing:
- Comprehensive Markdown support
- Enhanced Markdown preview
- Mermaid diagram integration
- Emoji support
- Footnotes capability

[View Details](documentation-essentials/README.md)

## Quick Start

### Development Version
```bash
# Install development version (private)
code --install-extension ih8sirdavi.vscode-master-collection

# Or install individual collections
code --install-extension ih8sirdavi.core-dev-essentials
code --install-extension ih8sirdavi.python-dev-essentials
code --install-extension ih8sirdavi.documentation-essentials
```

### Production Version
```bash
# Install production version (public)
code --install-extension ihatesirdavi.vscode-master-collection

# Or install individual collections
code --install-extension ihatesirdavi.core-dev-essentials
code --install-extension ihatesirdavi.python-dev-essentials
code --install-extension ihatesirdavi.documentation-essentials
```

## Development

This repository uses modern tooling and practices:
- pnpm (with npm fallback) for package management
- Workspace management for collections
- Automated build and publish workflows
- Comprehensive documentation

### Extension Management

The repository includes a cleanup script that helps manage VS Code extensions:
```bash
# Run cleanup script to manage extensions
pnpm run cleanup
# or
npm run cleanup
```

The cleanup script:
- Installs missing extensions from collections
- Removes unnecessary extensions
- Preserves essential extensions
- Updates VS Code settings
- Handles extension dependencies

### Getting Started

1. Clone the repository:
   ```bash
   # Development version (private)
   git clone https://github.com/ih8sirdavi/vscode-extensions.git

   # Production version (public)
   git clone https://github.com/ihatesirdavi/vscode-extensions.git

   cd vscode-extensions
   ```

2. Install dependencies:
   ```bash
   # Using pnpm (preferred)
   pnpm install

   # Using npm (fallback)
   npm install
   ```

3. Build collections:
   ```bash
   pnpm run package-all
   # or
   npm run package-all
   ```

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed development instructions.

## Repository Structure

```
vscode-extensions/
├── collections/          # Individual extension collections
│   ├── core-dev-essentials/
│   ├── python-dev-essentials/
│   └── documentation-essentials/
├── scripts/             # Automation tools
│   ├── cleanup-extensions.js
│   ├── create-collections.js
│   └── README.md
├── reports/            # Extension analysis
│   └── README.md
└── package.json       # Master collection config
```

## Branches

- `main` - Development version (private, ih8sirdavi)
- `production` - Production version (public, ihatesirdavi)

## Publishing

### Development Version
```bash
# Switch to main branch
git checkout main

# Publish development version
pnpm run publish-all
```

### Production Version
```bash
# Switch to production branch
git checkout production

# Publish production version
pnpm run publish-all
```

## Documentation

- [Contributing Guide](CONTRIBUTING.md) - How to contribute
- [Scripts Documentation](scripts/README.md) - Automation tools
- [Reports](reports/README.md) - Extension analysis
- [Structure](STRUCTURE.md) - Repository organization

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.