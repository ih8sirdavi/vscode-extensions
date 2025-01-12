# Core Development Essentials

Essential extensions for core development tasks in VS Code.

## Features

### Core Development Tools
- EditorConfig support (editorconfig.editorconfig)
- Project management (alefragnani.project-manager)
- Task tracking (gruntfuggly.todo-tree)

### GitHub Integration
- Pull Requests and Issues (github.vscode-pull-request-github)
- GitHub Actions (github.vscode-github-actions)

### Container Development (Disabled by Default)
These extensions are installed but disabled by default to reduce startup time. Enable them when needed for container development:

- Docker support (ms-azuretools.vscode-docker)
- Kubernetes tools (ms-kubernetes-tools.vscode-kubernetes-tools)
- Bridge to Kubernetes (mindaro.mindaro)

## Installation

Search for "Core Development Essentials" in VS Code extensions marketplace or run:
```bash
code --install-extension ih8sirdavi.core-dev-essentials
```

## Usage

### Regular Development
All core development tools and GitHub integrations are enabled by default for immediate use.

### Container Development
To use Docker/Kubernetes features:

1. Open VS Code Command Palette (Ctrl+Shift+P)
2. Search for "Enable Extension"
3. Enable any of the following as needed:
   - Docker
   - Kubernetes Tools
   - Bridge to Kubernetes

## Extension Details

### EditorConfig
- Maintains consistent coding styles across editors and IDEs
- Supports .editorconfig files
- Automatic formatting based on project settings

### Project Manager
- Quick access to your projects
- Save project workspaces
- Organize projects by tags
- Support for Git repositories

### Todo Tree
- Finds TODO and FIXME comments in your code
- Shows them in a tree view
- Customizable search patterns
- Highlights in code

### GitHub Integration
- Full GitHub Pull Request and Issues integration
- GitHub Actions workflows
- Code review tools
- Branch management

### Container Tools (Optional)
- Docker file intellisense
- Container management
- Kubernetes cluster management
- Local development with containers

## Configuration

### Enabling Container Extensions
```json
// Enable in settings.json when needed:
{
  "extensions.disabled": [
    // Remove the extension you want to enable
    "ms-azuretools.vscode-docker",
    "ms-kubernetes-tools.vscode-kubernetes-tools",
    "mindaro.mindaro"
  ]
}
```

## License

This extension pack is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.