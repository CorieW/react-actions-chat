import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Connect, Plugin } from 'vite';
import { createSettingsRecommendationHandler } from './settingsRecommendationServer';

const API_PATH = '/api/recommendations';

async function readRequestBody(request: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];

    request.on('data', chunk => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    });
    request.on('end', () => {
      resolve(Buffer.concat(chunks).toString('utf8'));
    });
    request.on('error', reject);
  });
}

async function writeWebResponse(
  response: Response,
  serverResponse: ServerResponse<IncomingMessage>
): Promise<void> {
  serverResponse.statusCode = response.status;
  response.headers.forEach((value, key) => {
    serverResponse.setHeader(key, value);
  });
  serverResponse.end(await response.text());
}

function createMissingApiKeyResponse(): Response {
  return new Response(
    JSON.stringify({
      message:
        'Set OPENAI_API_KEY in examples/settings/.env.local before sending a settings recommendation query.',
    }),
    {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
}

function createSettingsRecommendationMiddleware(
  openAIApiKey?: string
): Connect.NextHandleFunction {
  const trimmedApiKey = openAIApiKey?.trim();
  const handler = trimmedApiKey
    ? createSettingsRecommendationHandler({
        apiKey: trimmedApiKey,
      })
    : null;

  return async (request, response, next) => {
    const requestUrl = request.url
      ? new URL(request.url, 'http://localhost')
      : null;

    if (!requestUrl || requestUrl.pathname !== API_PATH) {
      next();
      return;
    }

    if (request.method !== 'POST') {
      response.statusCode = 405;
      response.setHeader('Allow', 'POST');
      response.setHeader('Content-Type', 'application/json');
      response.end(JSON.stringify({ message: 'Use POST for this endpoint.' }));
      return;
    }

    if (!handler) {
      await writeWebResponse(createMissingApiKeyResponse(), response);
      return;
    }

    try {
      const body = await readRequestBody(request);
      const webRequest = new Request(requestUrl.toString(), {
        method: request.method,
        headers: {
          'Content-Type': request.headers['content-type'] ?? 'application/json',
        },
        body,
      });

      await writeWebResponse(await handler.handleRequest(webRequest), response);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Failed to handle settings recommendation request.';

      await writeWebResponse(
        new Response(JSON.stringify({ message }), {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
          },
        }),
        response
      );
    }
  };
}

/**
 * Adds a small local API endpoint to the settings example so embeddings can be
 * generated on the server in both dev and preview mode.
 */
export function settingsRecommendationApiPlugin(openAIApiKey?: string): Plugin {
  return {
    name: 'settings-recommendation-api',
    configureServer(server) {
      server.middlewares.use(
        createSettingsRecommendationMiddleware(openAIApiKey)
      );
    },
    configurePreviewServer(server) {
      server.middlewares.use(
        createSettingsRecommendationMiddleware(openAIApiKey)
      );
    },
  };
}
