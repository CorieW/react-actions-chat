/**
 * Builds semantic embeddings for the generated docs assistant corpus.
 *
 * Steps:
 * 1. Load the previously generated docs corpus from the docs assistant backend tree.
 * 2. Batch chunk text through the configured OpenAI embeddings endpoint.
 * 3. Persist the resulting vectors beside the corpus so the deployed function
 *    can answer queries without recomputing document embeddings at runtime.
 */

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const repoRoot = resolve(import.meta.dirname, '..');
const generatedDirectory = join(repoRoot, 'docs-chat', 'backend', 'generated');
const corpusFile = join(generatedDirectory, 'docsAssistantCorpus.json');
const outputFile = join(generatedDirectory, 'docsAssistantEmbeddings.json');
const openAIBaseUrl =
  process.env.OPENAI_BASE_URL?.trim()?.replace(/\/$/, '') ??
  'https://api.openai.com/v1';
const openAIApiKey = process.env.OPENAI_API_KEY?.trim() ?? '';
const embeddingModel =
  process.env.DOCS_ASSISTANT_EMBEDDING_MODEL?.trim() ??
  'text-embedding-3-small';
const batchSize = 20;

if (!openAIApiKey) {
  throw new Error(
    'Set OPENAI_API_KEY before generating docs assistant embeddings.'
  );
}

const corpus = JSON.parse(readFileSync(corpusFile, 'utf8'));
const chunks = Array.isArray(corpus?.chunks) ? corpus.chunks : [];

if (chunks.length === 0) {
  throw new Error(
    'The docs assistant corpus is empty. Run scripts/build-docs-assistant-corpus.js first.'
  );
}

const embeddingEntries = [];

for (let index = 0; index < chunks.length; index += batchSize) {
  const batch = chunks.slice(index, index + batchSize);
  const embeddings = await requestEmbeddings(
    batch.map(chunk => chunk.searchText)
  );

  if (embeddings.length !== batch.length) {
    throw new Error(
      `Expected ${batch.length} embedding(s) but received ${embeddings.length}.`
    );
  }

  embeddingEntries.push(
    ...batch.map((chunk, batchIndex) => ({
      id: chunk.id,
      embedding: embeddings[batchIndex],
    }))
  );

  console.log(
    `Embedded docs assistant chunks ${index + 1}-${index + batch.length} of ${chunks.length}.`
  );
}

mkdirSync(generatedDirectory, {
  recursive: true,
});
writeFileSync(
  outputFile,
  JSON.stringify(
    {
      dimensions: embeddingEntries[0]?.embedding?.length ?? 0,
      entries: embeddingEntries,
      generatedAt: new Date().toISOString(),
      itemCount: embeddingEntries.length,
      model: embeddingModel,
    },
    null,
    2
  )
);

console.log(
  `Generated docs assistant embeddings for ${embeddingEntries.length} chunk(s).`
);

async function requestEmbeddings(texts) {
  const response = await fetch(`${openAIBaseUrl}/embeddings`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      input: texts,
      model: embeddingModel,
    }),
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data?.error?.message ??
        data?.message ??
        `OpenAI embeddings request failed with status ${response.status}.`
    );
  }

  if (!Array.isArray(data?.data)) {
    throw new Error(
      'The embeddings response did not include a valid `data` array.'
    );
  }

  return data.data.map(item => item.embedding ?? []);
}
