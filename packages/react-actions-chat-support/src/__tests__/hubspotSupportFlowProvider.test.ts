import { describe, expect, it } from 'vitest';
import {
  createHubSpotSupportFlowProvider,
  type HubSpotFetchLike,
  type HubSpotTicketRecord,
} from 'react-actions-chat-support';

interface CapturedRequest {
  readonly url: string;
  readonly method: string;
  readonly headers: Readonly<Record<string, string>>;
  readonly body: unknown;
}

function createJsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

function readHeaders(headers: RequestInit['headers']): Record<string, string> {
  if (!headers) {
    return {};
  }

  if (headers instanceof Headers) {
    return Object.fromEntries(headers.entries());
  }

  if (Array.isArray(headers)) {
    return Object.fromEntries(headers);
  }

  return headers;
}

function readRequestUrl(input: RequestInfo | URL): string {
  if (typeof input === 'string') {
    return input;
  }

  if (input instanceof URL) {
    return input.toString();
  }

  return input.url;
}

function readRequestBody(body: BodyInit | null | undefined): unknown {
  if (!body) {
    return undefined;
  }

  if (typeof body !== 'string') {
    throw new Error('Expected HubSpot test request body to be JSON text.');
  }

  return JSON.parse(body) as unknown;
}

function createCapturedFetch(handler: (request: CapturedRequest) => Response): {
  readonly fetch: HubSpotFetchLike;
  readonly requests: readonly CapturedRequest[];
} {
  const requests: CapturedRequest[] = [];
  const fetch: HubSpotFetchLike = (input, init) => {
    const request: CapturedRequest = {
      url: readRequestUrl(input),
      method: init?.method ?? 'GET',
      headers: readHeaders(init?.headers),
      body: readRequestBody(init?.body),
    };
    requests.push(request);
    return Promise.resolve(handler(request));
  };

  return {
    fetch,
    requests,
  };
}

const hubSpotTicket: HubSpotTicketRecord = {
  id: '123',
  createdAt: '2026-05-01T10:00:00.000Z',
  updatedAt: '2026-05-01T11:00:00.000Z',
  properties: {
    subject: 'Login is blocked',
    content: 'The login page rejects valid SSO users.',
    hs_pipeline: 'support',
    hs_pipeline_stage: '2',
    hs_ticket_priority: 'HIGH',
    hubspot_owner_id: '789',
    customer_email: 'alex@example.com',
    live_chat_offered: 'false',
  },
};

const statusStageMap = {
  new: '1',
  open: '2',
  'pending-customer': '3',
  'pending-internal': '4',
  resolved: '5',
  closed: '6',
} as const;

describe('HubSpot support flow provider', () => {
  it('creates tickets and searches customer tickets through HubSpot CRM', async () => {
    const { fetch, requests } = createCapturedFetch(request => {
      const url = new URL(request.url);

      if (
        request.method === 'POST' &&
        url.pathname === '/crm/v3/objects/tickets'
      ) {
        return createJsonResponse(hubSpotTicket, 201);
      }

      if (
        request.method === 'POST' &&
        url.pathname === '/crm/v3/objects/tickets/search'
      ) {
        return createJsonResponse({
          results: [hubSpotTicket],
        });
      }

      return createJsonResponse({ message: 'Unexpected HubSpot request' }, 404);
    });
    const provider = createHubSpotSupportFlowProvider({
      accessToken: 'hubspot-token',
      fetch,
      pipelineId: 'support',
      statusStageMap,
      liveChatOfferedPropertyName: 'live_chat_offered',
      resolveOwnerLabel: ({ ownerId }) => {
        return ownerId === '789' ? 'Priya Agent' : undefined;
      },
    });

    const createdTicket = await provider.userCallbacks.createTicket?.({
      customer: {
        id: '456',
        name: 'Alex Morgan',
        email: 'alex@example.com',
      },
      summary: 'The login page rejects valid SSO users.',
      priority: 'urgent',
    });
    const customerTickets = await provider.userCallbacks.listTickets?.({
      id: '456',
      email: 'alex@example.com',
    });

    expect(createdTicket?.reference).toBe('123');
    expect(createdTicket?.status).toBe('open');
    expect(createdTicket?.priority).toBe('high');
    expect(createdTicket?.assignedTo).toBe('Priya Agent');
    expect(requests[0]?.url).toBe(
      'https://api.hubapi.com/crm/v3/objects/tickets'
    );
    expect(requests[0]?.headers.Authorization).toBe('Bearer hubspot-token');
    expect(requests[0]?.body).toEqual({
      properties: {
        subject: 'The login page rejects valid SSO users.',
        content: 'The login page rejects valid SSO users.',
        hs_pipeline_stage: '1',
        hs_ticket_priority: 'HIGH',
        hs_pipeline: 'support',
      },
      associations: [
        {
          to: {
            id: '456',
          },
          types: [
            {
              associationCategory: 'HUBSPOT_DEFINED',
              associationTypeId: 16,
            },
          ],
        },
      ],
    });
    expect(requests[1]?.body).toMatchObject({
      filterGroups: [
        {
          filters: [
            {
              propertyName: 'associations.contact',
              operator: 'EQ',
              value: '456',
            },
          ],
        },
      ],
      limit: 25,
    });
    expect(customerTickets?.map(ticket => ticket.reference)).toEqual(['123']);
  });

  it('maps queue searches, updates, and replies onto HubSpot ticket APIs', async () => {
    const { fetch, requests } = createCapturedFetch(request => {
      const url = new URL(request.url);

      if (
        request.method === 'POST' &&
        url.pathname === '/crm/v3/objects/tickets/search'
      ) {
        return createJsonResponse({
          results: [hubSpotTicket],
        });
      }

      if (
        request.method === 'PATCH' &&
        url.pathname === '/crm/v3/objects/tickets/123'
      ) {
        return createJsonResponse({
          ...hubSpotTicket,
          updatedAt: '2026-05-01T12:00:00.000Z',
          properties: {
            ...hubSpotTicket.properties,
            ...((request.body as { properties?: Record<string, string> })
              .properties ?? {}),
          },
        });
      }

      if (
        request.method === 'GET' &&
        url.pathname === '/crm/v3/objects/tickets/123'
      ) {
        return createJsonResponse(hubSpotTicket);
      }

      return createJsonResponse({ message: 'Unexpected HubSpot request' }, 404);
    });
    const provider = createHubSpotSupportFlowProvider({
      authorization: 'Bearer oauth-token',
      fetch,
      statusStageMap,
      liveChatOfferedPropertyName: 'live_chat_offered',
      resolveOwnerId: ({ assignedTo }) => {
        return assignedTo === 'Priya Agent' ? '789' : undefined;
      },
    });

    const queue = await provider.adminCallbacks.listTicketQueue?.({
      statuses: ['open'],
      assignedTo: '789',
    });
    const updatedTicket = await provider.adminCallbacks.updateTicket?.({
      reference: '123',
      status: 'resolved',
      priority: 'urgent',
      assignedTo: 'Priya Agent',
      liveChatOffered: true,
    });
    const repliedTicket = await provider.adminCallbacks.appendTicketMessage?.({
      reference: '123',
      author: 'agent',
      authorLabel: 'Priya Agent',
      body: 'We fixed the SSO routing.',
    });

    expect(queue?.map(ticket => ticket.reference)).toEqual(['123']);
    expect(requests[0]?.body).toMatchObject({
      filterGroups: [
        {
          filters: [
            {
              propertyName: 'hs_pipeline_stage',
              operator: 'IN',
              values: ['2'],
            },
            {
              propertyName: 'hubspot_owner_id',
              operator: 'EQ',
              value: '789',
            },
          ],
        },
      ],
    });
    expect(requests[1]?.body).toEqual({
      properties: {
        hs_pipeline_stage: '5',
        hs_ticket_priority: 'HIGH',
        hubspot_owner_id: '789',
        live_chat_offered: 'true',
      },
    });
    expect(updatedTicket?.status).toBe('resolved');
    expect(updatedTicket?.liveChatOffered).toBe(true);
    expect(requests[3]?.body).toMatchObject({
      properties: {
        content: expect.stringContaining(
          'agent (Priya Agent): We fixed the SSO routing.'
        ) as string,
      },
    });
    expect(repliedTicket?.summary).toContain('We fixed the SSO routing.');
  });
});
