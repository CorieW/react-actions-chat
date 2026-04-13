# `useInputFieldStore`

`useInputFieldStore` manages the single shared input field used by the chat UI.

Input-request flows use this store to switch the field into email, password, search, or other modes without rendering separate inline forms.

## What It Manages

- the current input value
- the current input type
- the current placeholder text
- the helper description shown above the input
- the active validator
- the registered input element and submit function

## Common Reads

Useful getters:

- `getInputFieldValue()`
- `getInputFieldType()`
- `getInputFieldPlaceholder()`
- `getInputFieldDescription()`
- `getInputFieldValidator()`
- `getInputFieldSubmitFunc()`
- `getInputFieldElement()`

Example:

```tsx
import { useInputFieldStore } from 'actionable-support-chat';

const inputFieldStore = useInputFieldStore.getState();
const currentValue = inputFieldStore.getInputFieldValue();
const currentType = inputFieldStore.getInputFieldType();
const helpText = inputFieldStore.getInputFieldDescription();
```

This is useful when your app needs to inspect whether the user is currently in a password step, email step, or search step.

## Common Writes

Useful setters:

- `setInputFieldValue(value)`
- `setInputFieldType(type)`
- `setInputFieldPlaceholder(text)`
- `setInputFieldDescription(text)`
- `setInputFieldValidator(validator)`
- `setInputFieldSubmitFunc(fn)`
- `setInputFieldElement(element)`

Reset helpers:

- `resetInputField()`
- `resetInputFieldValue()`
- `resetInputFieldType()`
- `resetInputFieldPlaceholder()`
- `resetInputFieldDescription()`
- `resetInputFieldValidator()`

## Typical Use Cases

- configuring input-request buttons
- checking whether the current step is a password flow
- reading the current input state in advanced multi-step flows
- resetting the shared field after a custom flow completes
