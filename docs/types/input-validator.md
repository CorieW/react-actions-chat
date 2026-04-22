# `InputValidator`

`InputValidator` is the function shape used to validate shared-input submissions.

## Shape

```ts
type InputValidator = (
  value: string,
  submission?: InputSubmission
) => InputValidationResult;
```

## Example

```tsx typecheck
const emailValidator = (value: string) => {
  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  return isValidEmail || 'Please enter a valid email address.';
};
```

Use it with `createRequestInputButtonDef(...)` or directly with `useInputFieldStore()`.

When uploads are enabled for a request-input flow, `submission.files` lets the
validator check whether the user attached any files alongside the text value.
