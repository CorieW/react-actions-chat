import type { MessageButton } from 'react-actions-chat';
import {
  extractProviderErrorMessage,
  getFetchImplementation,
  parseJsonResponse,
  type FetchLike,
} from './embedders/shared';
import {
  createQueryRecommendedActionsFlow,
  type QueryRecommendedAction,
  type QueryRecommendedActionsContext,
  type QueryRecommendedActionsFlow,
  type QueryRecommendedActionsFlowConfig,
  type QueryRecommendedActionsResolver,
  type QueryRecommendedActionsResult,
} from './queryRecommendedActionsFlow';
import {
  serializeRecommendedActionsMessages,
  type RemoteRecommendedAction,
  type RemoteRecommendedActionsRequest,
  type RemoteRecommendedActionsResponse,
} from './shared';

/**
 * Builds a client-side button from a remote recommendation payload.
 */
export type RemoteRecommendedActionFactory<TData = unknown> = (
  action: RemoteRecommendedAction<TData>
) =>
  | QueryRecommendedAction
  | null
  | undefined
  | Promise<QueryRecommendedAction | null | undefined>;

/**
 * Registry entry used to hydrate a remote action id into a concrete chat button.
 */
export type RemoteRecommendedActionRegistryEntry<TData = unknown> =
  | QueryRecommendedAction
  | RemoteRecommendedActionFactory<TData>;

/**
 * Registry keyed by remote action id.
 */
export type RemoteRecommendedActionRegistry<TData = unknown> = Readonly<
  Record<string, RemoteRecommendedActionRegistryEntry<TData>>
>;

interface RemoteRecommendedActionsClientConfigBase<
  TData = unknown,
> extends Omit<QueryRecommendedActionsFlowConfig, 'getRecommendedActions'> {
  /**
   * Backend endpoint that resolves recommendation queries.
   */
  readonly endpoint: string | URL;

  /**
   * Optional fetch implementation override.
   */
  readonly fetch?: FetchLike | undefined;

  /**
   * Optional headers merged into the default JSON request headers.
   */
  readonly headers?: Readonly<Record<string, string>> | undefined;

  /**
   * Optional request payload builder. When omitted, the helper sends the
   * shared request shape with the query and serialized chat history.
   */
  readonly buildRequestBody?:
    | ((args: {
        readonly query: string;
        readonly context: QueryRecommendedActionsContext;
      }) =>
        | RemoteRecommendedActionsRequest
        | Promise<RemoteRecommendedActionsRequest>)
    | undefined;

  /**
   * Optional response parser override. When omitted, the helper expects the
   * shared JSON response shape from the server helper.
   */
  readonly parseResponse?:
    | ((
        response: Response
      ) =>
        | RemoteRecommendedActionsResponse<TData>
        | readonly RemoteRecommendedAction<TData>[]
        | null
        | undefined
        | Promise<
            | RemoteRecommendedActionsResponse<TData>
            | readonly RemoteRecommendedAction<TData>[]
            | null
            | undefined
          >)
    | undefined;
}

/**
 * Client config that hydrates remote results with an action registry.
 */
export interface RemoteRecommendedActionsFlowConfigWithRegistry<
  TData = unknown,
> extends RemoteRecommendedActionsClientConfigBase<TData> {
  /**
   * Client-side actions indexed by the ids returned from the backend.
   */
  readonly actions: RemoteRecommendedActionRegistry<TData>;

  /**
   * Custom action factory is not used when a registry is supplied.
   */
  readonly createAction?: undefined;
}

/**
 * Client config that hydrates remote results with a custom action factory.
 */
export interface RemoteRecommendedActionsFlowConfigWithFactory<
  TData = unknown,
> extends RemoteRecommendedActionsClientConfigBase<TData> {
  /**
   * Custom resolver used to turn a remote action payload into a chat button.
   */
  readonly createAction: RemoteRecommendedActionFactory<TData>;

  /**
   * Registry-based hydration is not used when a custom factory is supplied.
   */
  readonly actions?: undefined;
}

/**
 * Configuration for the client helper that talks to a backend endpoint and
 * hydrates the response into real chat buttons.
 */
export type RemoteRecommendedActionsFlowConfig<TData = unknown> =
  | RemoteRecommendedActionsFlowConfigWithRegistry<TData>
  | RemoteRecommendedActionsFlowConfigWithFactory<TData>;

function isRemoteResponseArray<TData>(
  result:
    | RemoteRecommendedActionsResponse<TData>
    | readonly RemoteRecommendedAction<TData>[]
    | null
    | undefined
): result is readonly RemoteRecommendedAction<TData>[] {
  return Array.isArray(result);
}

function normalizeRemoteResponse<TData>(
  result:
    | RemoteRecommendedActionsResponse<TData>
    | readonly RemoteRecommendedAction<TData>[]
    | null
    | undefined
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

function applyRemoteActionOverrides(
  button: MessageButton,
  action: RemoteRecommendedAction<unknown>
): QueryRecommendedAction {
  return {
    ...button,
    ...(action.label ? { label: action.label } : {}),
    ...(action.variant ? { variant: action.variant } : {}),
  };
}

function usesActionRegistry<TData>(
  config: RemoteRecommendedActionsFlowConfig<TData>
): config is RemoteRecommendedActionsFlowConfigWithRegistry<TData> {
  return 'actions' in config;
}

async function resolveActionFromRegistry<TData>(
  action: RemoteRecommendedAction<TData>,
  actions: RemoteRecommendedActionRegistry<TData>
): Promise<QueryRecommendedAction> {
  const entry = actions[action.id];

  if (!entry) {
    throw new Error(
      `Remote recommendation "${action.id}" did not match any registered client action.`
    );
  }

  const button =
    typeof entry === 'function' ? await Promise.resolve(entry(action)) : entry;

  if (!button) {
    throw new Error(
      `Registered client action "${action.id}" did not return a button.`
    );
  }

  return applyRemoteActionOverrides(button, action);
}

/**
 * Creates a resolver that posts recommendation queries to a backend endpoint
 * and hydrates the response into local chat buttons.
 */
export function createRemoteRecommendedActionsResolver<TData = unknown>(
  config: RemoteRecommendedActionsFlowConfig<TData>
): QueryRecommendedActionsResolver {
  const {
    buildRequestBody,
    endpoint,
    fetch: fetchImpl,
    headers,
    parseResponse,
  } = config;
  const requestFetch = getFetchImplementation(fetchImpl);

  return async (
    query: string,
    context: QueryRecommendedActionsContext
  ): Promise<QueryRecommendedActionsResult> => {
    const requestBody = (await buildRequestBody?.({
      query,
      context,
    })) ?? {
      query,
      messages: serializeRecommendedActionsMessages(context.messages),
    };

    const response = await requestFetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: JSON.stringify(requestBody),
    });
    const parsedResponse = parseResponse
      ? await parseResponse(response)
      : await parseJsonResponse<RemoteRecommendedActionsResponse<TData>>(
          response
        );

    if (!response.ok) {
      throw new Error(
        extractProviderErrorMessage(
          parsedResponse,
          `Remote recommendation request failed with status ${response.status}.`
        )
      );
    }

    const normalizedResponse = normalizeRemoteResponse(parsedResponse);
    const remoteActions = normalizedResponse.recommendedActions ?? [];

    const recommendedActions = (
      await Promise.all(
        remoteActions.map(async action => {
          const hydratedAction = usesActionRegistry(config)
            ? await resolveActionFromRegistry(action, config.actions)
            : await Promise.resolve(config.createAction(action));

          if (!hydratedAction) {
            return null;
          }

          return applyRemoteActionOverrides(hydratedAction, action);
        })
      )
    ).filter((action): action is QueryRecommendedAction => action !== null);

    return {
      responseMessage: normalizedResponse.responseMessage,
      recommendedActions,
    };
  };
}

/**
 * Creates a query flow that sends recommendation lookups to a backend endpoint
 * and renders the hydrated results in the chat.
 */
export function createRemoteRecommendedActionsFlow<TData = unknown>(
  config: RemoteRecommendedActionsFlowConfig<TData>
): QueryRecommendedActionsFlow {
  return createQueryRecommendedActionsFlow({
    ...config,
    getRecommendedActions: createRemoteRecommendedActionsResolver(config),
  });
}
