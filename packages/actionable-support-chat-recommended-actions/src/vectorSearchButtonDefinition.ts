import type { AnyButtonDefinition } from 'actionable-support-chat';

/**
 * A button definition enriched with descriptive text for semantic retrieval.
 */
export type VectorSearchButtonDefinition<
  TButtonDefinition extends AnyButtonDefinition = AnyButtonDefinition,
> = TButtonDefinition & {
  readonly description?: string | undefined;
  readonly exampleQueries?: readonly string[] | undefined;
};

/**
 * Builds the default semantic search text for a button definition.
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
