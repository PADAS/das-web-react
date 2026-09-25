## PR Review Guidelines

### Context Awareness

Before reviewing a PR, read `AGENTS.md` at the repository root and treat it with higher priority than generic best practices.

### High‑level checks

- **Correctness**
  - The logic is correct and does what the business and the user need, as described in `AGENTS.md` and the PR
  - Edge cases and invalid input are handled: empty collections, absent values, failed requests
  - No unintended side effects or regressions in the code paths the change touches
- **Code Quality**
  - Follows the repository's conventions in `AGENTS.md`, not the older code around it
  - Clean and readable: clear names, no dead code, no needless complexity or cleverness
- **Performance**
  - No unnecessary re‑renders, effects, or expensive computations
  - No unbounded loops, large payloads, repeated work, or listeners left behind
  - Memoization and caching are justified and correct
- **Accessibility**
  - Complies with WCAG 2.1 AA
  - Semantic HTML where possible; ARIA roles and attributes only where needed, correct and minimal
  - Keyboard navigation works, and focus management is intentional
  - Labels, roles, and names are accessible to screen readers
- **Translations**
  - Every user-facing string goes through i18n and is present in every locale
  - Each translation is correct, and follows the wording the app already uses in that language
- **Tests**
  - Every change is fully covered by tests
  - Tests meaningfully assert behavior, and a regression test fails without the fix
  - Test names clearly describe the scenario and expectation
