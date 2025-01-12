# VS Code Extension Reports

This directory contains extension analysis reports that help track:
- Extension usage patterns
- Overlap detection
- Version updates
- Compatibility issues

## Report Format

Reports are JSON files with the following structure:
```json
{
  "timestamp": "2025-01-12T00:00:00Z",
  "extensions": [
    {
      "id": "publisher.extension",
      "version": "1.0.0",
      "category": "category",
      "usage": "active|inactive",
      "overlaps": ["other.extension"]
    }
  ]
}
```

## Generating Reports

1. Using the cleanup script:
   ```bash
   cd scripts
   npm run cleanup
   ```
   This will analyze installed extensions and generate a report before cleanup.

2. Manual report generation:
   ```bash
   code --list-extensions --show-versions > extensions.txt
   node scripts/analyze-extensions.js extensions.txt
   ```

## Report History

- [2025-01-12](report-2025-01-12.json) - Initial extension audit
  - Identified redundant extension packs
  - Found overlapping Python tools
  - Documented database extension usage

## Using Reports

Reports help:
1. Identify extension redundancies
2. Track extension usage over time
3. Plan collection updates
4. Make informed decisions about which extensions to keep

## Automation

Reports are automatically:
- Generated before cleanup operations
- Saved with timestamp-based filenames
- Analyzed for trends
- Used to update collections

## Contributing

When adding new reports:
1. Use the ISO date format for filenames
2. Update this README with key findings
3. Document any significant changes
4. Add relevant analysis notes