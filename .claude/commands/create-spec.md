# Create Specification

Your goal is to create a new specification file for `$ARGUMENTS`.

The specification file must define the requirements, constraints, and interfaces for the solution in a manner that is clear, unambiguous, and structured for effective use by Generative AIs.

## Before Writing

1. Read `CLAUDE.md` for project conventions
2. Explore relevant existing code in `src/` to understand current patterns
3. Check `src/types/` for existing interfaces that may be affected

## Spec File Location & Naming

Save in the `/spec/` directory using the convention: `spec-[type]-[description].md`

Where `[type]` is one of: `design`, `feature`, `refactor`, `fix`, `infrastructure`

Examples:

- `spec-feature-bookmark-tags.md`
- `spec-design-settings-redesign.md`
- `spec-refactor-ai-provider-interface.md`

## Template

```md
---
title: [Concise Title]
version: 1.0
date_created: [YYYY-MM-DD]
owner: [Team/Individual]
tags: [e.g., feature, component, hook, service, ui]
---

# Introduction

[Short description of what this spec covers and why.]

## 1. Purpose & Scope

[What problem does this solve? What's in scope and out of scope?]

## 2. Affected Areas

[List files, components, hooks, services, or types that will be created or modified.]

| Area | Action | Details |
|------|--------|---------|
| `src/components/X/` | Create | New component for... |
| `src/hooks/useX/` | Modify | Add new state for... |
| `src/types/x.ts` | Create | New interfaces for... |

## 3. Requirements

- **REQ-001**: [Requirement description]
- **REQ-002**: [Requirement description]

## 4. UI/UX Specifications

[For UI features: describe layout, interactions, states, responsive behavior. Reference design tokens from `src/styles/index.css`.]

### States
- Default state
- Loading state
- Error state
- Empty state

## 5. Interfaces & Data

[TypeScript interfaces, API contracts, Chrome storage keys affected.]

```typescript
// New types to create in src/types/
interface ExampleType {
  id: string;
  name: string;
}
```

## 6. Implementation Notes

[Key decisions, patterns to follow, gotchas. Reference CLAUDE.md rules.]

- Use arrow functions for all components and handlers
- Use design tokens only (no hardcoded values)
- Follow folder-per-hook pattern for new hooks
- Use `<Button>` component, not raw `<button>`

## 7. Acceptance Criteria

- **AC-001**: Given [context], When [action], Then [expected outcome]
- **AC-002**: [Additional criteria]

## 8. Edge Cases

[List edge cases and how they should be handled.]
```

<!-- markdownlint-disable-file MD031 MD040 -->

## Guidelines

- Be specific to MarkMind's architecture (React 19, TypeScript, Chrome Extension MV3)
- Reference actual file paths and existing patterns in the codebase
- Use design tokens from `src/styles/index.css` for any UI specs
- Keep it concise - specs are consumed by AI, not printed in books
- Include TypeScript interfaces for any new data structures
- Consider Chrome extension constraints (popup lifecycle, storage limits, permissions)
- **If the requirements are unclear or ambiguous, ASK the user before assuming** - do not invent requirements
