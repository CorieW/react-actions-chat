import type { IncomingMessage, ServerResponse } from 'node:http';
import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { reactActionsChatVitePlugin } from 'react-actions-chat/vite-plugin';
import { createOpenAITextGenerator } from '../../packages/react-actions-chat-llms/src/providers/index.ts';
import {
  handleTextGenerationApiRequest,
  type TextGenerationApiErrorResponse,
  type TextGenerationApiResponse,
} from '../../packages/react-actions-chat-llms/src/server/index.ts';

function createJsonResponse(
  body: TextGenerationApiResponse | TextGenerationApiErrorResponse | unknown,
  status: number
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

async function createWebRequest(req: IncomingMessage): Promise<Request> {
  const requestUrl = new URL(req.url ?? '/', 'http://localhost');
  const body = await readIncomingBody(req);

  return new Request(requestUrl, {
    method: req.method,
    headers: req.headers as HeadersInit,
    ...(body ? { body } : {}),
  });
}

async function readIncomingBody(
  req: IncomingMessage
): Promise<string | undefined> {
  if (req.method === 'GET' || req.method === 'HEAD') {
    return undefined;
  }

  const chunks: Uint8Array[] = [];

  for await (const chunk of req) {
    if (typeof chunk === 'string') {
      chunks.push(Buffer.from(chunk));
      continue;
    }

    chunks.push(chunk);
  }

  return Buffer.concat(chunks).toString('utf8');
}

async function sendWebResponse(
  res: ServerResponse,
  response: Response
): Promise<void> {
  res.statusCode = response.status;

  response.headers.forEach((value, key) => {
    res.setHeader(key, value);
  });

  res.end(await response.text());
}

interface MiddlewareContainer {
  use: (
    route: string,
    handler: (
      req: IncomingMessage,
      res: ServerResponse,
      next: (error?: unknown) => void
    ) => void | Promise<void>
  ) => void;
}

function createLlmBackendPlugin(env: Record<string, string>): Plugin {
  const attachMiddleware = (middlewares: MiddlewareContainer): void => {
    middlewares.use('/api/llm', async (req, res, next) => {
      try {
        const apiKey = env.OPENAI_API_KEY?.trim();

        if (!apiKey) {
          await sendWebResponse(
            res,
            createJsonResponse(
              {
                error: {
                  message:
                    'Set OPENAI_API_KEY in examples/llm-support/.env.local to use this example.',
                },
              },
              503
            )
          );
          return;
        }

        const request = await createWebRequest(req);
        const response = await handleTextGenerationApiRequest(request, {
          generator: createOpenAITextGenerator({
            apiKey,
            model: 'gpt-4.1-mini',
          }),
        });

        await sendWebResponse(res, response);
      } catch (error) {
        next(error);
      }
    });
  };

  return {
    name: 'llm-support-backend',
    configureServer(server): void {
      attachMiddleware(server.middlewares);
    },
    configurePreviewServer(server): void {
      attachMiddleware(server.middlewares);
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, '');

  return {
    plugins: [
      react(),
      reactActionsChatVitePlugin(),
      createLlmBackendPlugin(env),
    ],
  };
});
