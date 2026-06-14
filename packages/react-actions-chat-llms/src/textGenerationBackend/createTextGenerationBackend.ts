import { getFetchImplementation, parseJsonResponse } from '../shared';
import { getRequestWithoutSignal } from './request';
import {
  createTextGenerationBackendError,
  normalizeTextGenerationBackendResponse,
} from './response';
import type { TextGenerationBackendConfig, TextGenerator } from './types';

/**
 * Creates a text generation backend.
 *
 * @param config - Backend URL, headers, credentials, and optional fetch implementation.
 */
export function createTextGenerationBackend(
  config: TextGenerationBackendConfig
): TextGenerator {
  const { credentials, fetch: fetchImpl, headers, url } = config;
  const requestFetch = getFetchImplementation(fetchImpl);

  return {
    generateText: async request => {
      const requestWithoutSignal = getRequestWithoutSignal(request);
      const resolvedHeaders =
        typeof headers === 'function'
          ? await headers(requestWithoutSignal)
          : headers;
      const response = await requestFetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...resolvedHeaders,
        },
        ...(credentials ? { credentials } : {}),
        body: JSON.stringify(requestWithoutSignal),
        ...(request.signal ? { signal: request.signal } : {}),
      });
      const data = await parseJsonResponse(response);

      if (!response.ok) {
        throw createTextGenerationBackendError(data, response.status);
      }

      return normalizeTextGenerationBackendResponse(data);
    },
  };
}
