# Repository Structure

```
vscode-extensions/
├── collections/          # Individual extension collections
│   ├── core-dev-essentials/
│   ├── python-dev-essentials/
│   └── documentation-essentials/
│
├── scripts/             # Automation tools
│   ├── cleanup-extensions.js
│   ├── create-collections.js
│   ├── package.json
│   └── README.md
│
├── docs/               # Documentation
│   └── setup-vscode-path.md
│
├── reports/            # Extension analysis reports
│   ├── report-2025-01-12.json
│   └── README.md
│
├── .gitignore         # Git ignore patterns
├── LICENSE            # MIT License
├── package.json       # Workspace configuration
├── README.md          # Main documentation
└── STRUCTURE.md       # This file
```

## Key Components

### Collections
Each collection is a standalone VS Code extension pack:
- package.json (extension metadata)
- README.md (documentation)
- CHANGELOG.md (version history)
- LICENSE (MIT)

### Scripts
Automation tools for managing extensions:
- cleanup-extensions.js: Remove redundant extensions
- create-collections.js: Create/update collections
- Package scripts for common operations

### Documentation
- setup-vscode-path.md: VS Code PATH configuration
- Collection-specific documentation
- Usage guides and troubleshooting

### Reports
Extension analysis reports:
- JSON format reports
- Usage patterns
- Overlap detection
- Version tracking

## File Purposes

### Root Level
- package.json: Workspace configuration and scripts
- LICENSE: MIT License for the project
- .gitignore: Source control ignore patterns
- README.md: Project overview and documentation

### Collection Level
- package.json: Extension pack metadata
- README.md: Collection documentation
- CHANGELOG.md: Version history
- LICENSE: MIT License copy

### Scripts Level
- cleanup-extensions.js: Extension management
- create-collections.js: Collection creation
- package.json: Script dependencies and commands

## Development Workflow

1. Create/Update Collections
   ```bash
   npm run create
   ```

2. Clean Up Extensions
   ```bash
   npm run cleanup
   ```

3. Package Collections
   ```bash
   npm run package-all
   ```

4. Publish Updates
   ```bash
   npm run publish-all
   ```

## Maintenance

1. Regular Tasks
   - Generate extension reports
   - Update collections
   - Review redundancies
   - Publish updates

2. Documentation
   - Keep READMEs updated
   - Maintain changelogs
   - Update usage guides

3. Scripts
   - Maintain automation tools
   - Add new features
   - Fix bugs

4. Collections
   - Version updates
   - Compatibility checks
   - Feature additions