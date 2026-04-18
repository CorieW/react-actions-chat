# `MessageButton`

`MessageButton` is the base button shape used under messages.

## Fields

- `label`
- `onClick?`
- `variant?`
- `className?`
- `style?`
- `blocksInputWhileVisible?`

## Variants

- `default`
- `success`
- `error`
- `warning`
- `info`
- `dull`

`default` uses the active theme's button colors. The other variants use built-in semantic colors.

## Usage

This type is used by:

- plain message buttons
- input-request buttons after they are created
- confirmation follow-up buttons
- persistent buttons, with an additional `id`
