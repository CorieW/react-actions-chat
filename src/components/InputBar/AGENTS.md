# src/components/InputBar

Shared chat input component and helper modules for behavior, mode, and validation state.

## Directories

- `behavior/`: Helpers for applying disabled state, cooldowns, and other input behavior settings.
- `modes/`: Helpers for applying input type, placeholder, and description settings.
- `validation/`: Helpers for applying validators and submit guards to the shared input store.

## Files

- `InputBar.tsx`: Shared chat input component with modes, validation, and submit handling.
- `index.ts`: Barrel export for the shared input component.

## Writing Rules

- Keep the behavior, mode, and validation helpers slice-specific: each helper should only update its own subset of `useInputFieldStore` state and should keep a paired reset helper beside the configure helper.
- Preserve the accessible labels and `data-asc-role` hooks used by the shared Playwright helpers when editing `InputBar.tsx`.
- Follow inherited AGENTS.md guidance when applicable.
