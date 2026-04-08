# @intelmesh/cel — Development Guidelines

## Overview
Editor-agnostic language intelligence for CEL expressions with IntelMesh custom functions. Provides autocomplete, diagnostics, hover, and tokenization. Zero DOM dependency, works anywhere JavaScript runs.

## Code Conventions
- TypeScript strict mode, zero `any`
- JSDoc on ALL exported symbols
- Pure functions where possible
- Max 50 lines per function, max complexity 10
- No DOM APIs, no editor-specific imports

## Architecture
- `src/language.ts` — CelLanguage main class (facade)
- `src/completion.ts` — Context-aware completion provider
- `src/diagnostics.ts` — Expression validation and error reporting
- `src/hover.ts` — Hover information for positions
- `src/tokenizer.ts` — Syntax token stream for highlighting
- `src/parser.ts` — Lightweight CEL parser (positions, token boundaries)
- `src/registry.ts` — Function/variable/list/scope registry
- `src/builtins.ts` — Pre-registered IntelMesh functions
- `src/types.ts` — All public interfaces

## Testing
- Vitest, 80%+ coverage
- Test each provider independently
- Test context-aware completions thoroughly

## Key Principle
This library NEVER imports DOM, Monaco, CodeMirror, or any editor. It receives strings and positions, returns structured data. Editor integration is the consumer's responsibility.
