import {
  type RemoteRecommendedAction,
  type RemoteRecommendedActionsErrorResponse,
  type RemoteRecommendedActionsMessage,
  type RemoteRecommendedActionsRequest,
  type RemoteRecommendedActionsResponse,
} from './shared';

/**
 * Error resolver used by the server helper when a request fails.
 */
export type RemoteRecommendedActionsHandlerErrorResolver = (
  error: unknown
) => string;

/**
 * Resolver result accepted by the server helper.
 */
export type RemoteRecommendedActionsHandlerResult<TData = unknown> =
  | RemoteRecommendedActionsResponse<TData>
  | readonly RemoteRecommendedAction<TData>[]
  | null
  | undefined;

/**
 * Recommendation callback used by the server helper.
 */
export type RemoteRecommendedActionsHandlerResolver<TData = unknown> = (
  request: RemoteRecommendedActionsRequest
) =>
  | RemoteRecommendedActionsHandlerResult<TData>
  | Promise<RemoteRecommendedActionsHandlerResult<TData>>;

/**
 * Configuration for the backend helper that handles recommendation requests.
 */
export interface RemoteRecommendedActionsHandlerConfig<TData = unknown> {
  /**
   * Recommendation resolver that returns serializable action references.
   */
  readonly recommend: RemoteRecommendedActionsHandlerResolver<TData>;

  /**
   * Optional error message shown when recommendation resolution fails.
   */
  readonly errorMessage?:
    | string
    | RemoteRecommendedActionsHandlerErrorResolver
    | undefined;

  /**
   * Optional headers merged into every JSON response.
   */
  readonly headers?: Readonly<Record<string, string>> | undefined;

  /**
   * Optional callback for logging or error tracking.
   */
  readonly onError?:
    | ((
        error: unknown,
        request: RemoteRecommendedActionsRequest | null
      ) => void)
    | undefined;
}

/**
 * Public API returned by the backend helper.
 */
export interface RemoteRecommendedActionsHandler<TData = unknown> {
  /**
   * Handles an already-parsed request payload.
   */
  readonly handle: (
    request: RemoteRecommendedActionsRequest
  ) => Promise<RemoteRecommendedActionsResponse<TData>>;

  /**
   * Handles a standard web Request and returns a JSON Response.
   */
  readonly handleRequest: (request: Request) => Promise<Response>;
}

class RemoteRecommendedActionsValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RemoteRecommendedActionsValidationError';
  }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isRemoteMessage(
  value: unknown
): value is RemoteRecommendedActionsMessage {
  if (!isPlainObject(value)) {
    return false;
  }

  return (
    typeof value.id === 'number' &&
    (value.type === 'self' || value.type === 'other') &&
    typeof value.content === 'string' &&
    typeof value.rawContent === 'string' &&
    typeof value.timestamp === 'string'
  );
}

function assertRemoteRequest(
  value: unknown
): asserts value is RemoteRecommendedActionsRequest {
  if (!isPlainObject(value)) {
    throw new RemoteRecommendedActionsValidationError(
      'Recommendation request body must be a JSON object.'
    );
  }

  if (typeof value.query !== 'string') {
    throw new RemoteRecommendedActionsValidationError(
      'Recommendation request body must include a string query.'
    );
  }

  if (!Array.isArray(value.messages)) {
    throw new RemoteRecommendedActionsValidationError(
      'Recommendation request body must include a messages array.'
    );
  }

  if (!value.messages.every(isRemoteMessage)) {
    throw new RemoteRecommendedActionsValidationError(
      'Recommendation request messages must use the shared serialized message shape.'
    );
  }
}

function isRemoteResponseArray<TData>(
  result: RemoteRecommendedActionsHandlerResult<TData>
): result is readonly RemoteRecommendedAction<TData>[] {
  return Array.isArray(result);
}

function normalizeRemoteResponse<TData>(
  result: RemoteRecommendedActionsHandlerResult<TData>
): RemoteRecommendedActionsResponse<TData> {
  if (!result) {
    return {
      recommendedActions: [],
    };
  }

  if (isRemoteResponseArray(result)) {
    return {
      recommendedActions: result,
    };
  }

  return {
    responseMessage: result.responseMessage,
    recommendedActions: result.recommendedActions ?? [],
  };
}

function createJsonResponse(
  body:
    | RemoteRecommendedActionsResponse<unknown>
    | RemoteRecommendedActionsErrorResponse,
  status: number,
  headers: Readonly<Record<string, string>> | undefined
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  });
}

function resolveErrorMessage(
  error: unknown,
  message: string | RemoteRecommendedActionsHandlerErrorResolver | undefined
): string {
  if (typeof message === 'function') {
    return message(error);
  }

  return message ?? 'Recommendation request failed.';
}

/**
 * Creates a backend helper that validates the shared request shape and
 * returns JSON responses for remote recommendation lookups.
 */
export function createRemoteRecommendedActionsHandler<TData = unknown>(
  config: RemoteRecommendedActionsHandlerConfig<TData>
): RemoteRecommendedActionsHandler<TData> {
  const { errorMessage, headers, onError, recommend } = config;

  const handle = async (
    request: RemoteRecommendedActionsRequest
  ): Promise<RemoteRecommendedActionsResponse<TData>> => {
    assertRemoteRequest(request);
    return normalizeRemoteResponse(await recommend(request));
  };

  const handleRequest = async (request: Request): Promise<Response> => {
    let parsedRequest: RemoteRecommendedActionsRequest | null = null;

    try {
      const json = await request.json();
      assertRemoteRequest(json);
      parsedRequest = json;

      return createJsonResponse(await handle(parsedRequest), 200, headers);
    } catch (error) {
      onError?.(error, parsedRequest);

      if (error instanceof SyntaxError) {
        return createJsonResponse(
          {
            message: 'Recommendation request body must be valid JSON.',
          },
          400,
          headers
        );
      }

      if (error instanceof RemoteRecommendedActionsValidationError) {
        return createJsonResponse(
          {
            message: error.message,
          },
          400,
          headers
        );
      }

      return createJsonResponse(
        {
          message: resolveErrorMessage(error, errorMessage),
        },
        500,
        headers
      );
    }
  };

  return {
    handle,
    handleRequest,
  };
}
