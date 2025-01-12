# Core Development Essentials

A carefully curated collection of essential extensions for core development tasks. This pack provides the fundamental tools needed for efficient development workflows.

## Features

- 📝 EditorConfig support for consistent coding styles
- 🔄 GitHub Pull Request and Issues integration
- ⚡ GitHub Actions workflow support
- 📂 Project management and workspace organization
- ✅ TODO tree for task tracking

## Included Extensions

### Code Quality & Standards
- **editorconfig.editorconfig**: Maintain consistent coding styles across editors and IDEs

### GitHub Integration
- **github.vscode-pull-request-github**: Review and manage GitHub pull requests and issues
- **github.vscode-github-actions**: GitHub Actions workflow integration

### Project Management
- **alefragnani.project-manager**: Easily switch between projects
- **gruntfuggly.todo-tree**: Track TODO comments in your codebase

## Installation

This extension pack works with VS Code and compatible forks (VS Code Insiders, VS Codium, etc).

Search for "Core Development Essentials" in your editor's extensions marketplace.

Or install via CLI:
```bash
# VS Code
code --install-extension ih8sirdavi.core-dev-essentials

# VS Code Insiders
code-insiders --install-extension ih8sirdavi.core-dev-essentials

# VS Codium
codium --install-extension ih8sirdavi.core-dev-essentials

# VS Code OSS
code-oss --install-extension ih8sirdavi.core-dev-essentials
```

## Requirements

- Visual Studio Code 1.70.0 or compatible fork
- Git installed for GitHub integration features

## Extension Pack Benefits

1. **Consistent Coding Standards**
   - EditorConfig ensures your code follows project standards
   - Works across different editors and IDEs

2. **Streamlined GitHub Workflow**
   - Review pull requests without leaving VS Code
   - Manage GitHub Actions workflows
   - Track issues and discussions

3. **Enhanced Project Organization**
   - Switch between projects effortlessly
   - Track tasks and TODOs across your codebase
   - Organize workspaces efficiently

## Recommended Settings

For the best experience, we recommend:

```json
{
    "todo-tree.general.tags": [
        "TODO",
        "FIXME",
        "BUG",
        "HACK",
        "NOTE"
    ],
    "github.gitAuthentication": true,
    "projectManager.sortList": "Name"
}
```

## Support

- [Report Issues](https://marketplace.visualstudio.com/items?itemName=ih8sirdavi.core-dev-essentials/issues)
- [View Changelog](CHANGELOG.md)

## License

This extension pack is licensed under the [MIT License](LICENSE)