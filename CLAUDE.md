# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Context

This directory is a development workspace for trading system automation projects. The workspace contains various Python tools and scripts for financial compliance, document generation, and AI/ML development.

## Common Development Commands

### Python Scripts

Run Python scripts with dependencies:
```bash
# Activate virtual environment if needed
source .venv/bin/activate

# Run Python scripts
python3 filename.py

# For specific Python versions as configured in permissions
python3.10 filename.py
python3.11 filename.py
python3.12 filename.py
```

### Document Generation

The workspace includes tools for generating professional Chinese documents:

```bash
# Generate compliance training manual
python3 generate_training_manual.py

# Convert markdown to Word document
python3 convert_to_docx.py
```

Both scripts create Microsoft Word documents with Chinese typography, professional formatting, and compliance-focused content for financial institutions.

### Git Operations

Standard git operations are allowed:
```bash
git status
git add filename
git commit -m "message"
git push
git clone repository_url
git submodule status
git submodule init
git submodule update
git checkout branch_name
git rm filename
```

## Code Architecture Patterns

### Python Script Structure

Scripts in this workspace typically follow this structure:
1. Shebang line for Python 3 environment
2. Docstring with Chinese description of purpose
3. Import statements organized by standard library, third-party, and local modules
4. Function definitions with Chinese comments
5. Main execution block with `if __name__ == "__main__":`

### Document Generation Pattern

The document generation scripts use:
- **python-docx** library for Word document creation
- Chinese font handling with Microsoft YaHei (微软雅黑)
- Custom styling for headings, paragraphs, tables, and code blocks
- Structured content sections for compliance documentation

### Key Dependencies

Based on existing scripts, common dependencies include:
- `python-docx` - for Word document generation
- Standard library modules: re, sys, os, json, datetime

## Development Environment

### Allowed Operations

Claude Code has permissions for:
- File system operations (find, read, write)
- Git operations (full repository management)
- Python execution (multiple versions)
- Web operations (fetching from GitHub, web search)
- Network operations (curl)

### Output Style

The development environment is configured for "Explanatory" output style, providing detailed explanations of operations and code changes.

## Working with Trading Systems

When developing trading or financial compliance systems:

1. **Compliance Focus**: Scripts often deal with KYC (Know Your Customer), AML (Anti-Money Laundering), and PEP (Politically Exposed Persons) screening
2. **Documentation**: Heavy emphasis on generating professional documentation for regulatory compliance
3. **Chinese Language**: Many scripts are designed for Chinese financial institutions with Chinese UI and documentation
4. **Regulatory Standards**: Content references FATF recommendations and Chinese regulatory requirements

## Important Considerations

- Always verify that generated documents meet current regulatory requirements
- Chinese typography and formatting must be properly handled for professional documents
- When working with financial data, ensure proper security and confidentiality measures
- Scripts may contain hardcoded paths specific to the development environment
