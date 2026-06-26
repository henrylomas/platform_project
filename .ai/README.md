# AI-Assisted Development

This folder contains rules and specs for AI-assisted development in this repository.

## Workflow

Specs are written first, then implemented. AI tools treat specs as the source of truth and do not deviate from them without explicit instruction.

## Structure

```
.ai/
├── rules/   # Coding standards and conventions AI tools must follow
└── specs/   # Feature specifications used as implementation blueprints
```

## rules/

Persistent guidelines that apply across the entire codebase. AI tools read and follow these before writing any code.

## specs/

Per-feature specification documents. Each spec defines types, behaviour, and test requirements before a line of implementation is written. When a spec and existing code conflict, raise the discrepancy rather than silently reconciling.
