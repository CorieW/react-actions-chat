# `InputValidationResult`

`InputValidationResult` is the return type used by shared-input validators.

## Allowed Results

- `true` when the submitted value is valid
- a `string` error message when the value is invalid

## Example

```ts typecheck
const value = 'user@example.com';

const result: boolean | string = value.includes('@')
  ? true
  : 'Please enter a valid email address.';
```
