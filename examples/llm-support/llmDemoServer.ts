import { fileURLToPath } from 'node:url';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { loadEnv, type Connect, type Plugin } from 'vite';

type DemoLLMMessageRole = 'assistant' | 'developer' | 'system' | 'user';
type LlmSupportExampleMode = 'fallback' | 'live';

interface DemoLLMMessage {
  readonly role: DemoLLMMessageRole;
  readonly content: string;
}

interface GenerateTextRequestBody {
  readonly messages: readonly DemoLLMMessage[];
  readonly maxOutputTokens?: number | undefined;
}

interface LlmDemoServerConfig {
  readonly baseUrl: string;
  readonly model: string;
  readonly mode: LlmSupportExampleMode;
}

interface OpenAIResponsesResponse {
  readonly output_text?: string;
  readonly output?: readonly {
    readonly content?: readonly {
      readonly type?: string;
      readonly text?: string;
    }[];
  }[];
  readonly error?: {
    readonly message?: string;
  };
  readonly message?: string;
}

const EXAMPLE_ROOT = fileURLToPath(new URL('.', import.meta.url));
const API_ROUTE = '/api/llm';
const DEFAULT_OPENAI_BASE_URL = 'https://api.openai.com/v1';
const DEFAULT_OPENAI_MODEL = 'gpt-5-mini';
const DEFAULT_EXAMPLE_MODE: LlmSupportExampleMode = 'live';

function resolveExampleMode(
  rawMode: string | undefined
): LlmSupportExampleMode {
  return rawMode === 'fallback' ? 'fallback' : DEFAULT_EXAMPLE_MODE;
}

function loadServerConfig(mode: string): LlmDemoServerConfig {
  const env = loadEnv(mode, EXAMPLE_ROOT, '');

  return {
    baseUrl:
      env.OPENAI_BASE_URL?.trim()?.replace(/\/$/, '') ??
      DEFAULT_OPENAI_BASE_URL,
    model: env.OPENAI_MODEL?.trim() ?? DEFAULT_OPENAI_MODEL,
    mode: resolveExampleMode(env.VITE_LLM_SUPPORT_EXAMPLE_MODE?.trim()),
  };
}

function sendJson(
  response: ServerResponse,
  statusCode: number,
  payload: unknown
): void {
  response.statusCode = statusCode;
  response.setHeader('Content-Type', 'application/json');
  response.end(JSON.stringify(payload));
}

function readBody(request: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = '';

    request.setEncoding('utf8');
    request.on('data', chunk => {
      body += chunk;
    });
    request.on('end', () => {
      resolve(body);
    });
    request.on('error', reject);
  });
}

function parseJson<T>(value: string): T {
  return JSON.parse(value) as T;
}

function parseJsonResponse<T>(value: string): T | null {
  if (value.trim() === '') {
    return null;
  }

  return parseJson<T>(value);
}

function isDemoLLMMessage(value: unknown): value is DemoLLMMessage {
  return (
    !!value &&
    typeof value === 'object' &&
    'role' in value &&
    typeof value.role === 'string' &&
    ['assistant', 'developer', 'system', 'user'].includes(value.role) &&
    'content' in value &&
    typeof value.content === 'string'
  );
}

function isGenerateTextRequestBody(
  value: unknown
): value is GenerateTextRequestBody {
  return (
    !!value &&
    typeof value === 'object' &&
    'messages' in value &&
    Array.isArray(value.messages) &&
    value.messages.every(isDemoLLMMessage) &&
    (!('maxOutputTokens' in value) ||
      value.maxOutputTokens === undefined ||
      typeof value.maxOutputTokens === 'number')
  );
}

function extractErrorMessage(data: unknown, fallbackMessage: string): string {
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

function extractOutputText(
  data: OpenAIResponsesResponse | null
): string | null {
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

function getLatestUserMessage(
  messages: readonly DemoLLMMessage[]
): string | undefined {
  const latestUserMessage = [...messages]
    .reverse()
    .find(message => message.role === 'user');

  return latestUserMessage?.content.trim();
}

function buildFallbackResponse(
  messages: readonly DemoLLMMessage[]
): string | null {
  const latestUserMessage = getLatestUserMessage(messages)?.toLowerCase();

  if (!latestUserMessage) {
    return null;
  }

  if (
    latestUserMessage.includes('password') ||
    latestUserMessage.includes('reset')
  ) {
    return 'Password resets are handled with an email link, and it usually arrives within two minutes.';
  }

  if (
    latestUserMessage.includes('billing') ||
    latestUserMessage.includes('annual') ||
    latestUserMessage.includes('discount')
  ) {
    return 'Northstar Cloud offers monthly or annual billing, and annual billing includes a 15% discount.';
  }

  if (
    latestUserMessage.includes('export') ||
    latestUserMessage.includes('data')
  ) {
    return 'Data exports can be requested from Settings, and they usually finish within 24 hours.';
  }

  if (
    latestUserMessage.includes('support') ||
    latestUserMessage.includes('human')
  ) {
    return 'Human support is available Monday to Friday, 9 AM to 5 PM GMT.';
  }

  if (
    latestUserMessage.includes('cancel') ||
    latestUserMessage.includes('close account')
  ) {
    return 'Customers can cancel anytime, and the plan stays active until the current billing period ends.';
  }

  return 'This fallback demo can answer questions about passwords, billing, exports, cancellations, and support availability.';
}

function createLlmDemoMiddleware(
  config: LlmDemoServerConfig
): Connect.NextHandleFunction {
  return async (request, response, next) => {
    if (request.url !== API_ROUTE) {
      next();
      return;
    }

    if (request.method !== 'POST') {
      sendJson(response, 405, {
        message: 'Use POST when sending chat turns to this demo endpoint.',
      });
      return;
    }

    let parsedBody: unknown;

    try {
      parsedBody = parseJson(await readBody(request));
    } catch {
      sendJson(response, 400, {
        message: 'The demo backend expected a JSON request body.',
      });
      return;
    }

    if (!isGenerateTextRequestBody(parsedBody)) {
      sendJson(response, 400, {
        message:
          'The demo backend expected a body with chat messages and an optional maxOutputTokens value.',
      });
      return;
    }

    if (config.mode === 'fallback') {
      sendJson(response, 200, {
        text:
          buildFallbackResponse(parsedBody.messages) ??
          'The fallback demo could not find an answer for that request.',
      });
      return;
    }

    const apiKeyHeader = request.headers['x-openai-api-key'];
    const apiKey =
      typeof apiKeyHeader === 'string'
        ? apiKeyHeader.trim()
        : Array.isArray(apiKeyHeader)
          ? (apiKeyHeader[0]?.trim() ?? '')
          : '';

    if (!apiKey) {
      sendJson(response, 400, {
        message:
          'Enter an API key in the startup step before sending a message.',
      });
      return;
    }

    try {
      const openAIResponse = await fetch(`${config.baseUrl}/responses`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: config.model,
          input: parsedBody.messages,
          ...(parsedBody.maxOutputTokens
            ? {
                max_output_tokens: parsedBody.maxOutputTokens,
              }
            : {}),
        }),
      });
      const data = parseJsonResponse<OpenAIResponsesResponse>(
        await openAIResponse.text()
      );

      if (!openAIResponse.ok) {
        sendJson(response, openAIResponse.status, {
          message: extractErrorMessage(
            data,
            `OpenAI request failed with status ${openAIResponse.status}.`
          ),
        });
        return;
      }

      const text = extractOutputText(data);

      if (!text) {
        sendJson(response, 502, {
          message: 'OpenAI did not return any assistant text for this request.',
        });
        return;
      }

      sendJson(response, 200, {
        text,
      });
    } catch (error) {
      sendJson(response, 500, {
        message:
          error instanceof Error
            ? error.message
            : 'The demo backend could not reach OpenAI.',
      });
    }
  };
}

export function createLlmDemoServerPlugin(): Plugin {
  return {
    name: 'llm-support-demo-server',
    configurePreviewServer(server) {
      server.middlewares.use(
        createLlmDemoMiddleware(loadServerConfig(server.config.mode))
      );
    },
    configureServer(server) {
      server.middlewares.use(
        createLlmDemoMiddleware(loadServerConfig(server.config.mode))
      );
    },
  };
}
