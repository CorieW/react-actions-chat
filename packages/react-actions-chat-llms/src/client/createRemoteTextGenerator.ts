import type {
  GenerateTextRequest,
  GeneratedTextResult,
  TextGenerator,
} from '../providers';
import {
  extractProviderErrorMessage,
  getFetchImplementation,
  parseJsonResponse,
  type FetchLike,
} from '../providers/shared';
import type {
  TextGenerationApiErrorResponse,
  TextGenerationApiRequest,
  TextGenerationApiResponse,
} from '../server';

type AsyncHeadersFactory = (
  request: TextGenerationApiRequest
) => HeadersInit | Promise<HeadersInit>;

export interface RemoteTextGeneratorConfig {
  readonly url: string | URL;
  readonly credentials?: RequestCredentials | undefined;
  readonly fetch?: FetchLike | undefined;
  readonly headers?: HeadersInit | AsyncHeadersFactory | undefined;
}

function omitSignal(request: GenerateTextRequest): TextGenerationApiRequest {
  const { signal: _signal, ...rest } = request;
  return rest;
}

/**
 * Creates a text generator that calls your own backend endpoint instead of a
 * provider API directly. Use this in the browser to avoid exposing provider
 * credentials to the client.
 */
export function createRemoteTextGenerator(
  config: RemoteTextGeneratorConfig
): TextGenerator {
  const { credentials, fetch: fetchImpl, headers, url } = config;
  const requestFetch = getFetchImplementation(fetchImpl);

  return {
    generateText: async (
      request: GenerateTextRequest
    ): Promise<GeneratedTextResult> => {
      const apiRequest = omitSignal(request);
      const resolvedHeaders =
        typeof headers === 'function' ? await headers(apiRequest) : headers;
      const response = await requestFetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...resolvedHeaders,
        },
        ...(credentials ? { credentials } : {}),
        body: JSON.stringify(apiRequest),
        ...(request.signal ? { signal: request.signal } : {}),
      });
      const data = await parseJsonResponse<
        TextGenerationApiResponse | TextGenerationApiErrorResponse
      >(response);

      if (!response.ok) {
        throw new Error(
          extractProviderErrorMessage(
            data,
            `Text generation backend request failed with status ${response.status}.`
          )
        );
      }

      if (!data || typeof data !== 'object' || !('text' in data)) {
        throw new Error(
          'The text generation backend did not return a valid response.'
        );
      }

      if (typeof data.text !== 'string') {
        throw new Error(
          'The text generation backend response did not include a text string.'
        );
      }

      return data;
    },
  };
}
