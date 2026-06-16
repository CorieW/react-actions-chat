import type { EmbeddingVector } from '../embedders';

/**
 * Calculates cosine similarity between two embedding vectors.
 *
 * @param left - Left value in the comparison.
 * @param right - Right value in the comparison.
 */
export function cosineSimilarity(
  left: EmbeddingVector,
  right: EmbeddingVector
): number {
  if (left.length !== right.length) {
    throw new Error('Embedding vectors must have the same length.');
  }

  let dotProduct = 0;
  let leftMagnitude = 0;
  let rightMagnitude = 0;

  for (let index = 0; index < left.length; index += 1) {
    const leftValue = left[index] ?? 0;
    const rightValue = right[index] ?? 0;

    dotProduct += leftValue * rightValue;
    leftMagnitude += leftValue * leftValue;
    rightMagnitude += rightValue * rightValue;
  }

  if (leftMagnitude === 0 || rightMagnitude === 0) {
    return 0;
  }

  return dotProduct / Math.sqrt(leftMagnitude * rightMagnitude);
}
