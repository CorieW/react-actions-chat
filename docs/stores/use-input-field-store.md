# `useInputFieldStore`

`useInputFieldStore` manages the single shared input field used by the chat UI.

Input-request flows use this store to switch the field into email, password, search, or other modes without rendering separate inline forms.

## What It Manages

- the current input value
- the current input type
- the current placeholder text
- the current disabled placeholder text
- the helper description shown above the input
- the currently selected files
- whether the optional upload button is visible
- the active file validator
- the active validator
- the active submit guard
- the default and current disabled state
- the registered input element and submit function

## Common Reads

Useful getters:

- `getInputFieldValue()`
- `getInputFieldType()`
- `getInputFieldPlaceholder()`
- `getInputFieldDisabledPlaceholder()`
- `getInputFieldDescription()`
- `getInputFieldFiles()`
- `getInputFieldFileUploadEnabled()`
- `getInputFieldFileValidator()`
- `getInputFieldValidator()`
- `getInputFieldSubmitGuard()`
- `getInputFieldDisabled()`
- `getInputFieldDisabledDefault()`
- `getInputFieldSubmitFunc()`
- `getInputFieldElement()`

Example:

```tsx typecheck
import { useInputFieldStore } from 'react-actions-chat';

const inputFieldStore = useInputFieldStore.getState();
const currentValue = inputFieldStore.getInputFieldValue();
const currentType = inputFieldStore.getInputFieldType();
const helpText = inputFieldStore.getInputFieldDescription();
const selectedFiles = inputFieldStore.getInputFieldFiles();
```

This is useful when your app needs to inspect whether the user is currently in a password step, email step, search step, or upload-enabled request flow.

## Common Writes

Useful setters:

- `setInputFieldValue(value)`
- `setInputFieldType(type)`
- `setInputFieldPlaceholder(text)`
- `setInputFieldDisabledPlaceholder(text)`
- `setInputFieldDescription(text)`
- `setInputFieldFiles(files)`
- `setInputFieldFileUploadEnabled(enabled)`
- `setInputFieldFileValidator(validator)`
- `setInputFieldValidator(validator)`
- `setInputFieldSubmitGuard(guard)`
- `setInputFieldDisabled(disabled)`
- `setInputFieldDisabledDefault(disabled)`
- `setInputFieldSubmitFunc(fn)`
- `setInputFieldElement(element)`

Reset helpers:

- `resetInputField()`
- `resetInputFieldValue()`
- `resetInputFieldType()`
- `resetInputFieldPlaceholder()`
- `resetInputFieldDisabledPlaceholder()`
- `resetInputFieldDescription()`
- `resetInputFieldFiles()`
- `resetInputFieldFileUploadEnabled()`
- `resetInputFieldFileValidator()`
- `resetInputFieldValidator()`
- `resetInputFieldSubmitGuard()`
- `resetInputFieldDisabled()`
- `resetInputFieldDisabledDefault()`

## Typical Use Cases

- configuring input-request buttons
- checking whether the current step is a password flow
- enabling upload-aware request-input flows
- reading the current input state in advanced multi-step flows
- resetting the shared field after a custom flow completes

`Chat` uses the default disabled state to decide whether typing should be available outside an active input-request flow. The component defaults to `disabled`, and sets that baseline to enabled only when you pass `allowFreeTextInput`.
