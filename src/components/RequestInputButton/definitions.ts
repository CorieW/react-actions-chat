import type { RequestInputButtonDefinition } from './types';

/**
 * Creates a reusable definition for an input request button. Apps can pass
 * this definition to createButton and provide runtime callbacks there.
 *
 * @param definition The `Omit<RequestInputButtonDefinition, 'kind'>` object.
 */
export function createRequestInputButtonDef(
  definition: Omit<RequestInputButtonDefinition, 'kind'>
): RequestInputButtonDefinition {
  return {
    ...definition,
    kind: 'request-input',
  };
}
