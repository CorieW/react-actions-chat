import type { GenerateTextRequest } from './types';

/**
 * Serializable request payload sent to text-generation backends.
 */
export type SerializableGenerateTextRequest = Omit<
  GenerateTextRequest,
  'signal'
>;

/**
 * Removes the AbortSignal before serializing a backend request body.
 *
 * @param request - Request payload being sent or normalized.
 */
export function getRequestWithoutSignal(
  request: GenerateTextRequest
): SerializableGenerateTextRequest {
  const { signal: _signal, ...requestWithoutSignal } = request;
  return requestWithoutSignal;
}
