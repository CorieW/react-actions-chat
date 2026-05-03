import { createQueryRecommendedActionsFlow } from '../queryFlow';
import type { QueryRecommendedActionsFlow } from '../queryFlow';
import { createVectorSearchResolver } from './search';
import type { VectorSearchQueryRecommendedActionsFlowConfig } from './types';
import type { VectorSearchButtonDefinition } from '../vectorSearchButtonDefinition';

/**
 * Creates a query flow with built-in embedding and vector search wiring for
 * button definitions.
 *
 * @param config - Vector-search recommendation configuration to inspect or resolve.
 */
export function createVectorSearchQueryRecommendedActionsFlow<
  TButtonDefinition extends VectorSearchButtonDefinition,
>(
  config: VectorSearchQueryRecommendedActionsFlowConfig<TButtonDefinition>
): QueryRecommendedActionsFlow {
  return createQueryRecommendedActionsFlow({
    ...config,
    getRecommendedActions: createVectorSearchResolver(config),
  });
}
