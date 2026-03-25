## PR Review Guidelines

### Context Awareness

Before reviewing a PR, read the following project-specific rules and treat them with higher priority than generic best practices:

- `.cursor/rules/business.mdc`
- `.cursor/rules/development.mdc`
- `.cursor/rules/testing.mdc`

### High‑level checks

- **Code Quality**
  - Clarity, correctness, and maintainability over cleverness
  - Matches existing patterns, conventions, and folder structure
  - Handles edge cases and invalid input appropriately
- **Tests**
  - All code must be tested
  - Tests meaningfully assert behavior
  - Test names clearly describe the scenario and expectation
- **Accessibility**
  - Semantic HTML is used where possible
  - ARIA roles and attributes are correct and minimal
  - Keyboard navigation is supported
  - Focus management is intentional
  - Labels, roles, and names are accessible to screen readers
- **Performance**
  - Avoid unnecessary re‑renders, effects, or expensive computations
  - Watch for unbounded loops, large payloads, or repeated work
  - Ensure memoization or caching is justified and correct
