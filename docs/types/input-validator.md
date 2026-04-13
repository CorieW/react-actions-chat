# `InputValidator`

`InputValidator` is the function shape used to validate shared-input submissions.

## Shape

```ts
type InputValidator = (value: string) => boolean | string;
```

## Example

```tsx
const emailValidator = (value: string) => {
  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  return isValidEmail || 'Please enter a valid email address.';
};
```

Use it with `createRequestInputButtonDef(...)` or directly with `useInputFieldStore()`.
