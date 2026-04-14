import type {
  GenerateTextRequest,
  GeneratedTextResult,
  LlmMessage,
  TextGenerator,
} from '../providers';

export interface TextGenerationApiRequest {
  readonly messages: readonly LlmMessage[];
  readonly maxOutputTokens?: number | undefined;
  readonly stopSequences?: readonly string[] | undefined;
  readonly temperature?: number | undefined;
  readonly topP?: number | undefined;
}

export type TextGenerationApiResponse = GeneratedTextResult;

export interface TextGenerationApiErrorResponse {
  readonly error: {
    readonly message: string;
  };
}

export interface ExecuteTextGenerationApiRequestConfig {
  readonly generator: TextGenerator;
  readonly signal?: AbortSignal | undefined;
}

export interface HandleTextGenerationApiRequestConfig {
  readonly generator: TextGenerator;
  readonly onError?:
    | ((error: unknown) =>
        | {
            readonly message: string;
            readonly status?: number | undefined;
          }
        | Promise<{
            readonly message: string;
            readonly status?: number | undefined;
          }>)
    | undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isLlmMessage(value: unknown): value is LlmMessage {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.content === 'string' &&
    (value.role === 'system' ||
      value.role === 'user' ||
      value.role === 'assistant')
  );
}

function createJsonResponse(
  body: TextGenerationApiResponse | TextGenerationApiErrorResponse,
  status: number,
  init: ResponseInit = {}
): Response {
  return new Response(JSON.stringify(body), {
    ...init,
    status,
    headers: {
      'Content-Type': 'application/json',
      ...init.headers,
    },
  });
}

function createErrorResponse(message: string, status: number): Response {
  return createJsonResponse(
    {
      error: {
        message,
      },
    },
    status
  );
}

/**
 * Validates and normalizes the JSON body expected by the backend text
 * generation endpoint.
 */
export function parseTextGenerationApiRequest(
  value: unknown
): TextGenerationApiRequest {
  if (!isRecord(value)) {
    throw new Error('Text generation request body must be a JSON object.');
  }

  if (
    !Array.isArray(value.messages) ||
    value.messages.length === 0 ||
    !value.messages.every(isLlmMessage)
  ) {
    throw new Error(
      'Text generation request body must include a valid messages array.'
    );
  }

  if (
    'maxOutputTokens' in value &&
    value.maxOutputTokens !== undefined &&
    (!Number.isInteger(value.maxOutputTokens as number) ||
      (value.maxOutputTokens as number) <= 0)
  ) {
    throw new Error(
      'maxOutputTokens must be a positive integer when provided.'
    );
  }

  if (
    'stopSequences' in value &&
    value.stopSequences !== undefined &&
    (!Array.isArray(value.stopSequences) ||
      !value.stopSequences.every(item => typeof item === 'string'))
  ) {
    throw new Error('stopSequences must be an array of strings when provided.');
  }

  if (
    'temperature' in value &&
    value.temperature !== undefined &&
    !isFiniteNumber(value.temperature)
  ) {
    throw new Error('temperature must be a finite number when provided.');
  }

  if (
    'topP' in value &&
    value.topP !== undefined &&
    !isFiniteNumber(value.topP)
  ) {
    throw new Error('topP must be a finite number when provided.');
  }

  return {
    messages: value.messages,
    ...(value.maxOutputTokens !== undefined
      ? { maxOutputTokens: value.maxOutputTokens as number }
      : {}),
    ...(value.stopSequences !== undefined
      ? { stopSequences: value.stopSequences as readonly string[] }
      : {}),
    ...(value.temperature !== undefined
      ? { temperature: value.temperature as number }
      : {}),
    ...(value.topP !== undefined ? { topP: value.topP as number } : {}),
  };
}

/**
 * Runs a validated text-generation API request through the configured server
 * side generator. This is useful in frameworks that manage request and
 * response objects for you.
 */
export async function executeTextGenerationApiRequest(
  value: unknown,
  config: ExecuteTextGenerationApiRequestConfig
): Promise<TextGenerationApiResponse> {
  const parsedRequest = parseTextGenerationApiRequest(value);
  const generatorRequest: GenerateTextRequest = {
    ...parsedRequest,
    ...(config.signal ? { signal: config.signal } : {}),
  };

  return config.generator.generateText(generatorRequest);
}

/**
 * Creates a fetch-style POST handler for a backend text-generation endpoint.
 * It validates the JSON body, calls the server-side generator, and returns a
 * normalized JSON response that the browser helper can consume.
 */
export async function handleTextGenerationApiRequest(
  request: Request,
  config: HandleTextGenerationApiRequestConfig
): Promise<Response> {
  if (request.method !== 'POST') {
    return createErrorResponse(
      'Method not allowed. Use POST for text generation requests.',
      405
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return createErrorResponse(
      'Text generation request body must be valid JSON.',
      400
    );
  }

  try {
    const result = await executeTextGenerationApiRequest(body, {
      generator: config.generator,
      signal: request.signal,
    });

    return createJsonResponse(result, 200);
  } catch (error) {
    if (error instanceof Error) {
      const validationMessages = new Set([
        'Text generation request body must be a JSON object.',
        'Text generation request body must include a valid messages array.',
        'maxOutputTokens must be a positive integer when provided.',
        'stopSequences must be an array of strings when provided.',
        'temperature must be a finite number when provided.',
        'topP must be a finite number when provided.',
      ]);

      if (validationMessages.has(error.message)) {
        return createErrorResponse(error.message, 400);
      }
    }

    if (config.onError) {
      const handledError = await config.onError(error);

      return createErrorResponse(
        handledError.message,
        handledError.status ?? 500
      );
    }

    return createErrorResponse(
      error instanceof Error
        ? error.message
        : 'Text generation failed on the backend.',
      500
    );
  }
}
