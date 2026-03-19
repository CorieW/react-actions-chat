# Coding Strategy

- Prioritize testing for key functionality.
- Do not add dedicated tests for minor behavior unless that behavior is especially risky or business-critical.
- Minor functionality may still be included in test coverage (whether E2E, integration, or unit) when it fits naturally into existing testing.
- Add doc comments to important code units, such as classes, functions, and files, where they improve maintainability.
- Add inline comments when logic is unclear, non-obvious, or sufficiently complex to benefit from explanation.
- Write comments in plain language. Keep them concise and avoid jargon.

# Testing Strategy

- Use unit tests to validate key functionality across both common scenarios and relevant edge cases.
- Use integration tests to verify key functionality that depends on multiple parts of the system working together.
- Use Playwright for E2E testing to validate real user interactions across supported browsers.
- E2E tests should simulate the real thing as closely as possible. This means, no mocking or stubbing of dependencies unless absolutely necessary.
- E2E tests should cover primary user journeys, not every small UI detail in isolation.
- Tests should not be flimsy to change; they should be robust and reliable. For example, do not write tests that are only valid for a specific implementation detail.