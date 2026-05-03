import type { AnyButtonDefinition } from 'react-actions-chat';

/**
 * A button definition enriched with descriptive text for semantic retrieval.
 */
export type VectorSearchButtonDefinition<
  TButtonDefinition extends AnyButtonDefinition = AnyButtonDefinition,
> = TButtonDefinition & {
  /**
   * Descriptive text shown to users or sent to a provider.
   */
  readonly description?: string | undefined;
  /**
   * Example user queries that should surface this button definition.
   */
  readonly exampleQueries?: readonly string[] | undefined;
};

/**
 * Builds the default semantic search text for a button definition.
 *
 * @param definition - Button definition to convert.
 */
export function buildVectorSearchButtonText(
  definition: VectorSearchButtonDefinition
): string {
  const label =
    'label' in definition
      ? definition.label
      : 'initialLabel' in definition
        ? definition.initialLabel
        : '';

  return [
    label,
    definition.description ?? '',
    ...(definition.exampleQueries ?? []),
  ]
    .map(part => part.trim())
    .filter(part => part !== '')
    .join(' ');
}
