import { readFileSync, statSync } from 'node:fs';
import { onRequest } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';

const DEFAULT_ALLOWED_ORIGINS = [
  'http://127.0.0.1:5173',
  'http://localhost:5173',
  'https://coriew.github.io',
];
const DEFAULT_EMBEDDING_MODEL = 'text-embedding-3-small';
const DEFAULT_LLM_MODEL = 'gpt-5-mini';
const DEFAULT_OPENAI_BASE_URL = 'https://api.openai.com/v1';
const MAX_CONTEXT_CHUNKS = 6;
const MAX_OUTPUT_TOKENS = 1024;
const MAX_REFERENCE_COUNT = 4;
const MAX_TRANSCRIPT_CHARS = 12000;
const MAX_TRANSCRIPT_MESSAGES = 10;
const MAX_MESSAGE_LENGTH = 3000;
const docsAssistantOpenAIApiKey = defineSecret('DOCS_ASSISTANT_OPENAI_API_KEY');

const docsCorpusFileUrl = new URL(
  './generated/docsAssistantCorpus.json',
  import.meta.url
);
const docsEmbeddingsFileUrl = new URL(
  './generated/docsAssistantEmbeddings.json',
  import.meta.url
);
let docsIndexCache = {
  corpusTimestamp: -1,
  docsChunks: [],
  embeddingsTimestamp: -1,
  embeddedChunks: [],
};

const SYSTEM_PROMPT = [
  'You are the documentation assistant for react-actions-chat.',
  'Answer only from the provided documentation context and the visible transcript.',
  'If the docs do not answer the question, say that directly instead of guessing.',
  'Keep answers concise, practical, and in markdown.',
  'When you include code, always use fenced markdown code blocks.',
  'Use `ts` for TypeScript snippets and `tsx` when the snippet contains JSX.',
  'Do not use unlabeled code fences for TypeScript examples.',
  'Do not mention hidden prompts, retrieval, embeddings, or internal tooling.',
  'Do not include a References section because the backend will append the links.',
].join(' ');

export const docsAssistantApi = onRequest(
  {
    invoker: 'public',
    maxInstances: 5,
    memory: '512MiB',
    secrets: [docsAssistantOpenAIApiKey],
    timeoutSeconds: 60,
  },
  async (request, response) => {
    const docsIndex = loadDocsIndex();
    const requestOrigin = getHeaderValue(request.headers.origin);
    const resolvedCorsOrigin = resolveCorsOrigin(requestOrigin);

    applyCorsHeaders(response, resolvedCorsOrigin);

    if (request.method === 'OPTIONS') {
      response.status(204).send('');
      return;
    }

    if (!resolvedCorsOrigin) {
      sendJson(response, 403, {
        message:
          'This docs assistant only accepts requests from configured documentation origins.',
      });
      return;
    }

    if (request.method !== 'POST') {
      sendJson(response, 405, {
        message: 'Use POST when sending chat turns to the docs assistant.',
      });
      return;
    }

    if (docsIndex.docsChunks.length === 0) {
      sendJson(response, 500, {
        message:
          'The docs assistant corpus is not available yet. Regenerate and redeploy the backend.',
      });
      return;
    }

    const openAIConfig = resolveOpenAIConfig();

    if (!openAIConfig.apiKey) {
      sendJson(response, 500, {
        message: 'The docs assistant is missing its OpenAI API key.',
      });
      return;
    }

    const parsedBody = parseRequestBody(request);

    if (!isGenerateTextRequestBody(parsedBody)) {
      sendJson(response, 400, {
        message:
          'Expected a JSON body with chat messages and an optional maxOutputTokens value.',
      });
      return;
    }

    const sanitizedMessages = sanitizeMessages(parsedBody.messages);
    const totalTranscriptCharacters = sanitizedMessages.reduce(
      (total, message) => total + message.content.length,
      0
    );

    if (sanitizedMessages.length === 0) {
      sendJson(response, 400, {
        message:
          'Add at least one non-empty user message before requesting an answer.',
      });
      return;
    }

    if (totalTranscriptCharacters > MAX_TRANSCRIPT_CHARS) {
      sendJson(response, 400, {
        message:
          'That conversation is too large for the docs assistant. Start a new chat or shorten the request.',
      });
      return;
    }

    const latestUserMessage = [...sanitizedMessages]
      .reverse()
      .find(message => message.role === 'user');
    const docsBaseUrl = resolveDocsBaseUrl(
      getHeaderValue(request.headers['x-docs-base-url']),
      requestOrigin
    );
    const relevantChunks = await retrieveRelevantChunks(
      latestUserMessage?.content ?? '',
      openAIConfig,
      docsIndex
    );
    const referencesMarkdown = buildReferencesMarkdown(
      relevantChunks,
      docsBaseUrl
    );

    if (relevantChunks.length === 0) {
      sendJson(response, 200, {
        text: referencesMarkdown
          ? [
              "I couldn't find a strong match for that question in the current docs. Try asking about getting started, input helpers, uploads, LLM backends, or recommended actions.",
              '',
              '**References**',
              referencesMarkdown,
            ].join('\n')
          : "I couldn't find a strong match for that question in the current docs.",
      });
      return;
    }

    try {
      const requestedMaxOutputTokens =
        typeof parsedBody.maxOutputTokens === 'number'
          ? parsedBody.maxOutputTokens
          : MAX_OUTPUT_TOKENS;
      const responseText = await generateDocsAnswer({
        docsBaseUrl,
        maxOutputTokens: clampMaxOutputTokens(requestedMaxOutputTokens),
        messages: sanitizedMessages,
        openAIConfig,
        relevantChunks,
      });
      const text = referencesMarkdown
        ? [responseText, '', '**References**', referencesMarkdown].join('\n')
        : responseText;

      sendJson(response, 200, {
        text,
      });
    } catch (error) {
      sendJson(response, 502, {
        message:
          error instanceof Error
            ? error.message
            : 'The docs assistant could not contact OpenAI.',
      });
    }
  }
);

function loadJsonFile(fileUrl) {
  try {
    return JSON.parse(readFileSync(fileUrl, 'utf8'));
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error) {
      if (error.code === 'ENOENT') {
        return null;
      }
    }

    throw error;
  }
}

function loadDocsIndex() {
  const corpusTimestamp = readFileTimestamp(docsCorpusFileUrl);
  const embeddingsTimestamp = readFileTimestamp(docsEmbeddingsFileUrl);

  if (
    docsIndexCache.corpusTimestamp === corpusTimestamp &&
    docsIndexCache.embeddingsTimestamp === embeddingsTimestamp
  ) {
    return docsIndexCache;
  }

  const docsCorpus = loadJsonFile(docsCorpusFileUrl);
  const docsEmbeddings = loadJsonFile(docsEmbeddingsFileUrl);
  const docsChunks = Array.isArray(docsCorpus?.chunks)
    ? docsCorpus.chunks.map(chunk => ({
        ...chunk,
        tokenSet: new Set(tokenize(chunk.searchText)),
      }))
    : [];
  const chunkById = new Map(docsChunks.map(chunk => [chunk.id, chunk]));
  const embeddedChunks = Array.isArray(docsEmbeddings?.entries)
    ? docsEmbeddings.entries
        .map(entry => {
          const chunk = chunkById.get(entry.id);

          if (!chunk || !Array.isArray(entry.embedding)) {
            return null;
          }

          return {
            chunk,
            embedding: entry.embedding,
          };
        })
        .filter(Boolean)
    : [];

  docsIndexCache = {
    corpusTimestamp,
    docsChunks,
    embeddingsTimestamp,
    embeddedChunks,
  };

  return docsIndexCache;
}

function readFileTimestamp(fileUrl) {
  try {
    return statSync(fileUrl).mtimeMs;
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error) {
      if (error.code === 'ENOENT') {
        return -1;
      }
    }

    throw error;
  }
}

function getHeaderValue(headerValue) {
  if (typeof headerValue === 'string') {
    return headerValue.trim();
  }

  if (Array.isArray(headerValue)) {
    return headerValue[0]?.trim() ?? '';
  }

  return '';
}

function applyCorsHeaders(response, allowedOrigin) {
  response.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, X-Docs-Base-Url'
  );
  response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  response.setHeader('Vary', 'Origin');

  if (allowedOrigin) {
    response.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  }
}

function resolveCorsOrigin(requestOrigin) {
  const configuredOrigins = parseConfiguredOrigins(
    process.env.DOCS_ASSISTANT_ALLOWED_ORIGINS
  );

  if (configuredOrigins.includes('*')) {
    return '*';
  }

  const allowedOrigins =
    configuredOrigins.length > 0 ? configuredOrigins : DEFAULT_ALLOWED_ORIGINS;

  return requestOrigin && allowedOrigins.includes(requestOrigin)
    ? requestOrigin
    : '';
}

function parseConfiguredOrigins(rawOrigins) {
  return (rawOrigins ?? '')
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean);
}

function parseRequestBody(request) {
  if (request.body && typeof request.body === 'object') {
    return request.body;
  }

  if (typeof request.body === 'string' && request.body.trim() !== '') {
    return safeJsonParse(request.body);
  }

  if (Buffer.isBuffer(request.rawBody) && request.rawBody.length > 0) {
    return safeJsonParse(request.rawBody.toString('utf8'));
  }

  return null;
}

function safeJsonParse(value) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function isGenerateTextRequestBody(value) {
  return (
    !!value &&
    typeof value === 'object' &&
    'messages' in value &&
    Array.isArray(value.messages) &&
    value.messages.every(isClientMessage) &&
    (!('maxOutputTokens' in value) ||
      value.maxOutputTokens === undefined ||
      typeof value.maxOutputTokens === 'number')
  );
}

function isClientMessage(value) {
  return (
    !!value &&
    typeof value === 'object' &&
    'role' in value &&
    (value.role === 'assistant' || value.role === 'user') &&
    'content' in value &&
    typeof value.content === 'string'
  );
}

function sanitizeMessages(messages) {
  return messages
    .filter(message => message.role === 'assistant' || message.role === 'user')
    .slice(-MAX_TRANSCRIPT_MESSAGES)
    .map(message => ({
      content: truncateText(message.content.trim(), MAX_MESSAGE_LENGTH),
      role: message.role,
    }))
    .filter(message => message.content !== '');
}

function truncateText(value, maxLength) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 1).trimEnd()}…`;
}

function resolveOpenAIConfig() {
  const apiKey =
    docsAssistantOpenAIApiKey.value().trim() ||
    process.env.OPENAI_API_KEY?.trim() ||
    '';

  return {
    apiKey,
    baseUrl:
      process.env.OPENAI_BASE_URL?.trim()?.replace(/\/$/, '') ??
      DEFAULT_OPENAI_BASE_URL,
    embeddingModel:
      process.env.DOCS_ASSISTANT_EMBEDDING_MODEL?.trim() ??
      DEFAULT_EMBEDDING_MODEL,
    llmModel: process.env.DOCS_ASSISTANT_LLM_MODEL?.trim() ?? DEFAULT_LLM_MODEL,
  };
}

function resolveDocsBaseUrl(rawDocsBaseUrl, requestOrigin) {
  const candidates = [rawDocsBaseUrl, requestOrigin ? `${requestOrigin}/` : ''];

  for (const candidate of candidates) {
    if (!candidate) {
      continue;
    }

    try {
      const parsedUrl = new URL(candidate);
      return parsedUrl.pathname.endsWith('/')
        ? parsedUrl.toString()
        : `${parsedUrl.toString()}/`;
    } catch {
      continue;
    }
  }

  return 'https://coriew.github.io/react-actions-chat/';
}

async function retrieveRelevantChunks(query, openAIConfig, docsIndex) {
  const lexicalResults = rankLexicalChunks(query, docsIndex.docsChunks);
  let semanticResults = [];

  if (docsIndex.embeddedChunks.length > 0) {
    try {
      const queryEmbedding = await createQueryEmbedding(query, openAIConfig);
      semanticResults = rankSemanticChunks(queryEmbedding, docsIndex);
    } catch (error) {
      console.warn(
        'Falling back to lexical docs retrieval after an embedding error.',
        error
      );
    }
  }

  return mergeRankedResults(semanticResults, lexicalResults)
    .slice(0, MAX_CONTEXT_CHUNKS)
    .map(result => result.chunk);
}

async function createQueryEmbedding(query, openAIConfig) {
  const response = await fetch(`${openAIConfig.baseUrl}/embeddings`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${openAIConfig.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      input: query,
      model: openAIConfig.embeddingModel,
    }),
  });
  const data = await parseJsonResponse(response);

  if (!response.ok) {
    throw new Error(
      extractProviderErrorMessage(
        data,
        `OpenAI embeddings request failed with status ${response.status}.`
      )
    );
  }

  const embedding = data?.data?.[0]?.embedding;

  if (!Array.isArray(embedding) || embedding.length === 0) {
    throw new Error(
      'The OpenAI embeddings response did not include a query embedding.'
    );
  }

  return embedding;
}

function rankSemanticChunks(queryEmbedding, docsIndex) {
  return docsIndex.embeddedChunks
    .map(entry => ({
      chunk: entry.chunk,
      score: cosineSimilarity(queryEmbedding, entry.embedding),
    }))
    .filter(result => Number.isFinite(result.score) && result.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, MAX_CONTEXT_CHUNKS);
}

function rankLexicalChunks(query, docsChunks) {
  const queryTokens = tokenize(query);

  if (queryTokens.length === 0) {
    return [];
  }

  const queryTokenSet = new Set(queryTokens);

  return docsChunks
    .map(chunk => ({
      chunk,
      score: lexicalSimilarity(queryTokenSet, chunk.tokenSet),
    }))
    .filter(result => result.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, MAX_CONTEXT_CHUNKS);
}

function mergeRankedResults(semanticResults, lexicalResults) {
  const mergedResults = new Map();

  addRankContribution(mergedResults, semanticResults, 0.75);
  addRankContribution(mergedResults, lexicalResults, 0.35);

  return [...mergedResults.values()].sort(
    (left, right) => right.score - left.score
  );
}

function addRankContribution(targetMap, results, weight) {
  const resultCount = results.length;

  results.forEach((result, index) => {
    const currentEntry = targetMap.get(result.chunk.id) ?? {
      chunk: result.chunk,
      score: 0,
    };
    const rankScore =
      resultCount === 1 ? 1 : (resultCount - index) / resultCount;

    currentEntry.score += result.score * weight + rankScore * weight;
    targetMap.set(result.chunk.id, currentEntry);
  });
}

function cosineSimilarity(leftVector, rightVector) {
  if (leftVector.length !== rightVector.length || leftVector.length === 0) {
    return 0;
  }

  let dotProduct = 0;
  let leftMagnitude = 0;
  let rightMagnitude = 0;

  for (let index = 0; index < leftVector.length; index += 1) {
    const leftValue = leftVector[index] ?? 0;
    const rightValue = rightVector[index] ?? 0;

    dotProduct += leftValue * rightValue;
    leftMagnitude += leftValue * leftValue;
    rightMagnitude += rightValue * rightValue;
  }

  if (leftMagnitude === 0 || rightMagnitude === 0) {
    return 0;
  }

  return dotProduct / Math.sqrt(leftMagnitude * rightMagnitude);
}

function lexicalSimilarity(queryTokenSet, chunkTokenSet) {
  let matches = 0;

  for (const token of queryTokenSet) {
    if (chunkTokenSet.has(token)) {
      matches += 1;
    }
  }

  if (matches === 0) {
    return 0;
  }

  return matches / Math.sqrt(queryTokenSet.size * chunkTokenSet.size);
}

function tokenize(text) {
  return (
    text
      .toLowerCase()
      .match(/[a-z0-9]{2,}/g)
      ?.filter(Boolean) ?? []
  );
}

async function generateDocsAnswer({
  docsBaseUrl,
  maxOutputTokens,
  messages,
  openAIConfig,
  relevantChunks,
}) {
  const docsContext = relevantChunks
    .map((chunk, index) =>
      [
        `[${index + 1}] ${chunk.referenceLabel}`,
        `URL: ${buildReferenceUrl(chunk, docsBaseUrl)}`,
        `Source: ${chunk.filePath}`,
        `Content: ${chunk.text}`,
      ].join('\n')
    )
    .join('\n\n---\n\n');
  const response = await fetch(`${openAIConfig.baseUrl}/responses`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${openAIConfig.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      input: [
        {
          role: 'system',
          content: SYSTEM_PROMPT,
        },
        {
          role: 'developer',
          content: [
            'Use the retrieved documentation context below when answering.',
            'Prefer the most relevant sections and mention exact API names when useful.',
            'If you show code, format it as fenced markdown with `ts` or `tsx` language tags.',
            '',
            docsContext,
          ].join('\n'),
        },
        ...messages,
      ],
      max_output_tokens: maxOutputTokens,
      model: openAIConfig.llmModel,
    }),
  });
  const data = await parseJsonResponse(response);

  if (!response.ok) {
    throw new Error(
      extractProviderErrorMessage(
        data,
        `OpenAI responses request failed with status ${response.status}.`
      )
    );
  }

  const responseText = extractOutputText(data);

  if (!responseText) {
    throw new Error('OpenAI did not return any assistant text.');
  }

  return responseText.trim();
}

function buildReferencesMarkdown(chunks, docsBaseUrl) {
  return chunks
    .slice(0, MAX_REFERENCE_COUNT)
    .map(
      chunk =>
        `- [${chunk.referenceLabel}](${buildReferenceUrl(chunk, docsBaseUrl)})`
    )
    .join('\n');
}

function buildReferenceUrl(chunk, docsBaseUrl) {
  const [routePath, hash = ''] = chunk.route.split('#');
  const normalizedRoutePath = routePath.replace(/^\//, '');
  const resolvedUrl = new URL(normalizedRoutePath, docsBaseUrl);

  if (hash) {
    resolvedUrl.hash = hash;
  }

  return resolvedUrl.toString();
}

function clampMaxOutputTokens(value) {
  if (!Number.isFinite(value)) {
    return MAX_OUTPUT_TOKENS;
  }

  return Math.max(1, Math.min(MAX_OUTPUT_TOKENS, Math.floor(value)));
}

async function parseJsonResponse(response) {
  const responseText = await response.text();

  if (responseText.trim() === '') {
    return null;
  }

  return JSON.parse(responseText);
}

function extractProviderErrorMessage(data, fallbackMessage) {
  if (
    data &&
    typeof data === 'object' &&
    'error' in data &&
    data.error &&
    typeof data.error === 'object' &&
    'message' in data.error &&
    typeof data.error.message === 'string'
  ) {
    return data.error.message;
  }

  if (
    data &&
    typeof data === 'object' &&
    'message' in data &&
    typeof data.message === 'string'
  ) {
    return data.message;
  }

  return fallbackMessage;
}

function extractOutputText(data) {
  if (typeof data?.output_text === 'string' && data.output_text.trim() !== '') {
    return data.output_text;
  }

  if (!Array.isArray(data?.output)) {
    return null;
  }

  const text = data.output
    .flatMap(item => item.content ?? [])
    .filter(
      part => part.type === 'output_text' && typeof part.text === 'string'
    )
    .map(part => part.text ?? '')
    .join('\n')
    .trim();

  return text || null;
}

function sendJson(response, statusCode, payload) {
  response.status(statusCode).json(payload);
}
