import type {
  AppendSupportTicketMessageInput,
  CreateSupportTicketInput,
  SupportAdminFlowCallbacks,
  SupportQueueFilter,
  SupportTicket,
  SupportTicketMessage,
  SupportTicketPriority,
  SupportTicketStatus,
  SupportUserFlowCallbacks,
  SupportUserIdentity,
  UpdateSupportTicketInput,
} from './supportFlowTypes';

export type HubSpotFetchLike = (
  input: RequestInfo | URL,
  init?: RequestInit
) => Promise<Response>;

export type HubSpotTicketStageMap = Partial<
  Record<SupportTicketStatus, string>
>;

export type HubSpotTicketPriorityMap = Partial<
  Record<SupportTicketPriority, string>
>;

export interface HubSpotSearchFilter {
  readonly propertyName: string;
  readonly operator: string;
  readonly value?: string | undefined;
  readonly values?: readonly string[] | undefined;
}

export interface HubSpotAssociationInput {
  readonly to: {
    readonly id: string | number;
  };
  readonly types: readonly {
    readonly associationCategory: string;
    readonly associationTypeId: number;
  }[];
}

export interface HubSpotTicketPropertiesContext {
  readonly input: CreateSupportTicketInput | UpdateSupportTicketInput;
}

export interface HubSpotTicketAssociationsContext {
  readonly customer: SupportUserIdentity;
  readonly input: CreateSupportTicketInput;
}

export interface HubSpotOwnerContext {
  readonly assignedTo: string;
  readonly input?: UpdateSupportTicketInput | undefined;
  readonly filter?: SupportQueueFilter | undefined;
}

export interface HubSpotOwnerLabelContext {
  readonly ownerId: string;
  readonly ticket: HubSpotTicketRecord;
}

export interface HubSpotCustomerTicketSearchContext {
  readonly customer: SupportUserIdentity;
}

export interface HubSpotTicketQueueSearchContext {
  readonly filter: SupportQueueFilter | undefined;
}

export interface HubSpotSupportFlowProviderConfig {
  readonly accessToken?: string | undefined;
  readonly authorization?: string | undefined;
  readonly baseUrl?: string | undefined;
  readonly ticketsPath?: string | undefined;
  readonly headers?: Readonly<Record<string, string>> | undefined;
  readonly fetch?: HubSpotFetchLike | undefined;
  readonly pageSize?: number | undefined;
  readonly pipelineId?: string | undefined;
  readonly statusStageMap?: HubSpotTicketStageMap | undefined;
  readonly defaultTicketStatus?: SupportTicketStatus | undefined;
  readonly priorityMap?: HubSpotTicketPriorityMap | undefined;
  readonly transcriptPropertyName?: string | undefined;
  readonly ownerPropertyName?: string | undefined;
  readonly customerEmailPropertyName?: string | undefined;
  readonly tagsPropertyName?: string | undefined;
  readonly liveChatOfferedPropertyName?: string | undefined;
  readonly associateCustomer?: boolean | undefined;
  readonly customerAssociationTypeId?: number | undefined;
  readonly resolveTicketProperties?:
    | ((
        context: HubSpotTicketPropertiesContext
      ) => Readonly<
        Record<string, string | number | boolean | null | undefined>
      >)
    | undefined;
  readonly resolveTicketAssociations?:
    | ((
        context: HubSpotTicketAssociationsContext
      ) => readonly HubSpotAssociationInput[] | undefined)
    | undefined;
  readonly resolveCustomerTicketFilter?:
    | ((
        context: HubSpotCustomerTicketSearchContext
      ) => HubSpotSearchFilter | undefined)
    | undefined;
  readonly resolveTicketQueueFilters?:
    | ((
        context: HubSpotTicketQueueSearchContext
      ) => readonly HubSpotSearchFilter[] | undefined)
    | undefined;
  readonly resolveOwnerId?:
    | ((context: HubSpotOwnerContext) => string | number | null | undefined)
    | undefined;
  readonly resolveOwnerLabel?:
    | ((context: HubSpotOwnerLabelContext) => string | undefined)
    | undefined;
}

export interface HubSpotSupportFlowProvider {
  readonly userCallbacks: Pick<
    SupportUserFlowCallbacks,
    'createTicket' | 'getTicket' | 'listTickets' | 'appendTicketMessage'
  >;
  readonly adminCallbacks: Pick<
    SupportAdminFlowCallbacks,
    'listTicketQueue' | 'getTicket' | 'updateTicket' | 'appendTicketMessage'
  >;
}

export interface HubSpotTicketRecord {
  readonly id?: string | undefined;
  readonly properties?:
    | Readonly<Record<string, string | null | undefined>>
    | undefined;
  readonly createdAt?: string | undefined;
  readonly updatedAt?: string | undefined;
  readonly archived?: boolean | undefined;
}

interface HubSpotTicketResponse extends HubSpotTicketRecord {
  readonly message?: string | undefined;
  readonly status?: string | undefined;
  readonly category?: string | undefined;
}

interface HubSpotSearchResponse {
  readonly results?: readonly HubSpotTicketRecord[] | undefined;
  readonly message?: string | undefined;
  readonly status?: string | undefined;
  readonly category?: string | undefined;
}

interface HubSpotRequestOptions {
  readonly method?: string | undefined;
  readonly body?: unknown;
}

interface HubSpotSearchRequest {
  readonly filterGroups?: readonly {
    readonly filters: readonly HubSpotSearchFilter[];
  }[];
  readonly properties?: readonly string[] | undefined;
  readonly sorts?: readonly {
    readonly propertyName: string;
    readonly direction: 'ASCENDING' | 'DESCENDING';
  }[];
  readonly limit?: number | undefined;
  readonly query?: string | undefined;
}

interface MapHubSpotTicketOptions {
  readonly fallbackCustomer?: SupportUserIdentity | undefined;
  readonly fallbackSummary?: string | undefined;
}

const DEFAULT_HUBSPOT_BASE_URL = 'https://api.hubapi.com';
const DEFAULT_HUBSPOT_TICKETS_PATH = '/crm/v3/objects/tickets';
const DEFAULT_HUBSPOT_PAGE_SIZE = 25;
const DEFAULT_HUBSPOT_CONTACT_TO_TICKET_ASSOCIATION_TYPE_ID = 16;
const DEFAULT_TRANSCRIPT_PROPERTY = 'content';
const DEFAULT_OWNER_PROPERTY = 'hubspot_owner_id';
const DEFAULT_STAGE_PROPERTY = 'hs_pipeline_stage';
const DEFAULT_PIPELINE_PROPERTY = 'hs_pipeline';
const DEFAULT_PRIORITY_PROPERTY = 'hs_ticket_priority';
const DEFAULT_SUBJECT_PROPERTY = 'subject';
const DEFAULT_CREATED_AT_PROPERTY = 'createdate';
const DEFAULT_UPDATED_AT_PROPERTY = 'hs_lastmodifieddate';
const DEFAULT_STATUS_STAGE_MAP: Required<HubSpotTicketStageMap> = {
  new: 'new',
  open: 'open',
  'pending-customer': 'pending-customer',
  'pending-internal': 'pending-internal',
  resolved: 'resolved',
  closed: 'closed',
};
const DEFAULT_PRIORITY_MAP: Required<HubSpotTicketPriorityMap> = {
  low: 'LOW',
  normal: 'MEDIUM',
  high: 'HIGH',
  urgent: 'HIGH',
};
const OPEN_SUPPORT_STATUSES = [
  'new',
  'open',
  'pending-customer',
  'pending-internal',
] as const;

function getFetchImplementation(
  fetchImpl?: HubSpotFetchLike
): HubSpotFetchLike {
  const resolvedFetch = fetchImpl ?? globalThis.fetch;

  if (!resolvedFetch) {
    throw new Error(
      'No fetch implementation was available for the HubSpot support provider.'
    );
  }

  return resolvedFetch;
}

function getAuthorizationHeader(
  config: HubSpotSupportFlowProviderConfig
): string | undefined {
  if (config.authorization) {
    return config.authorization;
  }

  if (config.accessToken) {
    return `Bearer ${config.accessToken}`;
  }

  return undefined;
}

function getPageSize(pageSize: number | undefined): number {
  if (!pageSize) {
    return DEFAULT_HUBSPOT_PAGE_SIZE;
  }

  return Math.min(Math.max(Math.trunc(pageSize), 1), 200);
}

function trimTrailingSlash(value: string): string {
  return value.replace(/\/$/, '');
}

function trimLeadingSlash(value: string): string {
  return value.replace(/^\//, '');
}

async function parseJsonResponse<T>(response: Response): Promise<T | null> {
  const responseText = await response.text();

  if (responseText.trim() === '') {
    return null;
  }

  return JSON.parse(responseText) as T;
}

function extractHubSpotErrorMessage(
  data: unknown,
  fallbackMessage: string
): string {
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

function normalizeHubSpotId(
  value: string | number | null | undefined
): string | null | undefined {
  if (value === null) {
    return null;
  }

  if (typeof value === 'number') {
    return String(value);
  }

  const trimmedValue = value?.trim();

  return trimmedValue || undefined;
}

function createTicketSubject(input: CreateSupportTicketInput): string {
  const explicitSubject = input.subject?.trim();

  if (explicitSubject) {
    return explicitSubject;
  }

  const summary = input.summary.trim();
  const words = summary.split(/\s+/).slice(0, 12).join(' ');
  return words || 'Support request';
}

function resolveStatusStage(
  status: SupportTicketStatus,
  config: HubSpotSupportFlowProviderConfig
): string {
  return config.statusStageMap?.[status] ?? DEFAULT_STATUS_STAGE_MAP[status];
}

function resolvePriority(
  priority: SupportTicketPriority,
  config: HubSpotSupportFlowProviderConfig
): string {
  return config.priorityMap?.[priority] ?? DEFAULT_PRIORITY_MAP[priority];
}

function mapHubSpotStageToStatus(
  stage: string | null | undefined,
  config: HubSpotSupportFlowProviderConfig
): SupportTicketStatus {
  if (!stage) {
    return 'open';
  }

  const map: Required<HubSpotTicketStageMap> = {
    ...DEFAULT_STATUS_STAGE_MAP,
    ...config.statusStageMap,
  };
  const match = Object.entries(map).find(([, stageId]) => stageId === stage);

  return (match?.[0] as SupportTicketStatus | undefined) ?? 'open';
}

function mapHubSpotPriorityToSupport(
  priority: string | null | undefined,
  config: HubSpotSupportFlowProviderConfig
): SupportTicketPriority {
  if (!priority) {
    return 'normal';
  }

  if (priority === resolvePriority('low', config)) {
    return 'low';
  }

  if (priority === resolvePriority('normal', config)) {
    return 'normal';
  }

  if (priority === resolvePriority('high', config)) {
    return 'high';
  }

  if (priority === resolvePriority('urgent', config)) {
    return 'urgent';
  }

  return 'normal';
}

function parseHubSpotDate(value: string | null | undefined): Date {
  if (!value) {
    return new Date();
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

function isNumericId(value: string | undefined): boolean {
  return Boolean(value && /^\d+$/.test(value));
}

function normalizeProperties(
  properties: Readonly<
    Record<string, string | number | boolean | null | undefined>
  >
): Record<string, string | number | boolean | null> {
  return Object.fromEntries(
    Object.entries(properties).filter(
      (entry): entry is [string, string | number | boolean | null] => {
        return entry[1] !== undefined;
      }
    )
  );
}

function getTicketReference(ticket: HubSpotTicketRecord): string {
  if (!ticket.id) {
    throw new Error('HubSpot ticket response did not include a ticket id.');
  }

  return ticket.id;
}

function splitTags(
  value: string | null | undefined
): readonly string[] | undefined {
  const tags = value
    ?.split(/[;,]/)
    .map(tag => tag.trim())
    .filter(Boolean);

  return tags && tags.length > 0 ? tags : undefined;
}

function createContentMessage(
  ticket: HubSpotTicketRecord,
  body: string
): SupportTicketMessage {
  return {
    id: `hubspot-ticket-${getTicketReference(ticket)}-content`,
    author: 'customer',
    body,
    createdAt: parseHubSpotDate(
      ticket.createdAt ?? ticket.properties?.[DEFAULT_CREATED_AT_PROPERTY]
    ),
  };
}

function appendTranscriptEntry(
  currentContent: string,
  input: AppendSupportTicketMessageInput
): string {
  const authorLabel = input.authorLabel
    ? `${input.author} (${input.authorLabel})`
    : input.author;
  const entry = `[${new Date().toISOString()}] ${authorLabel}: ${input.body.trim()}`;

  return currentContent.trim() ? `${currentContent.trim()}\n\n${entry}` : entry;
}

function createCustomerAssociation(
  customer: SupportUserIdentity,
  config: HubSpotSupportFlowProviderConfig
): HubSpotAssociationInput | undefined {
  const customerId = normalizeHubSpotId(customer.id);

  if (!customerId || !isNumericId(customerId)) {
    return undefined;
  }

  return {
    to: {
      id: customerId,
    },
    types: [
      {
        associationCategory: 'HUBSPOT_DEFINED',
        associationTypeId:
          config.customerAssociationTypeId ??
          DEFAULT_HUBSPOT_CONTACT_TO_TICKET_ASSOCIATION_TYPE_ID,
      },
    ],
  };
}

function mapHubSpotTicket(
  ticket: HubSpotTicketRecord,
  config: HubSpotSupportFlowProviderConfig,
  options: MapHubSpotTicketOptions = {}
): SupportTicket {
  const properties = ticket.properties ?? {};
  const transcriptProperty =
    config.transcriptPropertyName ?? DEFAULT_TRANSCRIPT_PROPERTY;
  const ownerProperty = config.ownerPropertyName ?? DEFAULT_OWNER_PROPERTY;
  const ownerId = properties[ownerProperty];
  const subject =
    properties[DEFAULT_SUBJECT_PROPERTY]?.trim() ||
    options.fallbackSummary?.trim() ||
    `HubSpot ticket ${getTicketReference(ticket)}`;
  const summary =
    properties[transcriptProperty]?.trim() ||
    options.fallbackSummary?.trim() ||
    subject;
  const owner = ownerId
    ? (config.resolveOwnerLabel?.({ ownerId, ticket }) ?? ownerId)
    : undefined;
  const tags = config.tagsPropertyName
    ? splitTags(properties[config.tagsPropertyName])
    : undefined;
  const liveChatOffered = config.liveChatOfferedPropertyName
    ? properties[config.liveChatOfferedPropertyName] === 'true'
    : false;

  return {
    reference: getTicketReference(ticket),
    subject,
    summary,
    customer: options.fallbackCustomer ?? {},
    status: mapHubSpotStageToStatus(properties[DEFAULT_STAGE_PROPERTY], config),
    priority: mapHubSpotPriorityToSupport(
      properties[DEFAULT_PRIORITY_PROPERTY],
      config
    ),
    ...(owner ? { assignedTo: owner } : {}),
    liveChatOffered,
    createdAt: parseHubSpotDate(
      ticket.createdAt ?? properties[DEFAULT_CREATED_AT_PROPERTY]
    ),
    updatedAt: parseHubSpotDate(
      ticket.updatedAt ?? properties[DEFAULT_UPDATED_AT_PROPERTY]
    ),
    messages: [createContentMessage(ticket, summary)],
    ...(tags ? { tags } : {}),
  };
}

function createTicketProperties(
  input: CreateSupportTicketInput,
  config: HubSpotSupportFlowProviderConfig
): Record<string, string | number | boolean | null> {
  const transcriptProperty =
    config.transcriptPropertyName ?? DEFAULT_TRANSCRIPT_PROPERTY;
  const defaultStatus = config.defaultTicketStatus ?? 'new';
  const tagsProperty = config.tagsPropertyName;
  const customerEmailProperty = config.customerEmailPropertyName;

  return normalizeProperties({
    [DEFAULT_SUBJECT_PROPERTY]: createTicketSubject(input),
    [transcriptProperty]: input.summary.trim(),
    [DEFAULT_STAGE_PROPERTY]: resolveStatusStage(defaultStatus, config),
    [DEFAULT_PRIORITY_PROPERTY]: resolvePriority(
      input.priority ?? 'normal',
      config
    ),
    ...(config.pipelineId
      ? { [DEFAULT_PIPELINE_PROPERTY]: config.pipelineId }
      : {}),
    ...(customerEmailProperty && input.customer.email
      ? { [customerEmailProperty]: input.customer.email }
      : {}),
    ...(tagsProperty && input.tags
      ? { [tagsProperty]: input.tags.join(';') }
      : {}),
    ...(config.resolveTicketProperties?.({ input }) ?? {}),
  });
}

function createUpdateProperties(
  input: UpdateSupportTicketInput,
  config: HubSpotSupportFlowProviderConfig,
  ownerId: string | null | undefined
): Record<string, string | number | boolean | null> {
  return normalizeProperties({
    ...(input.status
      ? { [DEFAULT_STAGE_PROPERTY]: resolveStatusStage(input.status, config) }
      : {}),
    ...(input.priority
      ? { [DEFAULT_PRIORITY_PROPERTY]: resolvePriority(input.priority, config) }
      : {}),
    ...(ownerId !== undefined
      ? { [config.ownerPropertyName ?? DEFAULT_OWNER_PROPERTY]: ownerId }
      : {}),
    ...(config.liveChatOfferedPropertyName &&
    input.liveChatOffered !== undefined
      ? { [config.liveChatOfferedPropertyName]: String(input.liveChatOffered) }
      : {}),
    ...(config.resolveTicketProperties?.({ input }) ?? {}),
  });
}

function createTicketAssociations(
  input: CreateSupportTicketInput,
  config: HubSpotSupportFlowProviderConfig
): readonly HubSpotAssociationInput[] | undefined {
  const resolvedAssociations = config.resolveTicketAssociations?.({
    customer: input.customer,
    input,
  });

  if (resolvedAssociations) {
    return resolvedAssociations;
  }

  if (config.associateCustomer === false) {
    return undefined;
  }

  const customerAssociation = createCustomerAssociation(input.customer, config);

  return customerAssociation ? [customerAssociation] : undefined;
}

function createCustomerTicketFilter(
  customer: SupportUserIdentity,
  config: HubSpotSupportFlowProviderConfig
): HubSpotSearchFilter | undefined {
  const resolvedFilter = config.resolveCustomerTicketFilter?.({ customer });

  if (resolvedFilter) {
    return resolvedFilter;
  }

  const customerId = normalizeHubSpotId(customer.id);

  if (customerId && isNumericId(customerId)) {
    return {
      propertyName: 'associations.contact',
      operator: 'EQ',
      value: customerId,
    };
  }

  if (config.customerEmailPropertyName && customer.email) {
    return {
      propertyName: config.customerEmailPropertyName,
      operator: 'EQ',
      value: customer.email,
    };
  }

  return undefined;
}

function createTicketQueueFilters(
  filter: SupportQueueFilter | undefined,
  config: HubSpotSupportFlowProviderConfig
): readonly HubSpotSearchFilter[] {
  const resolvedFilters = config.resolveTicketQueueFilters?.({ filter });

  if (resolvedFilters) {
    return resolvedFilters;
  }

  const statuses = filter?.statuses ?? OPEN_SUPPORT_STATUSES;
  const stageValues = statuses.map(status =>
    resolveStatusStage(status, config)
  );
  const filters: HubSpotSearchFilter[] = [
    {
      propertyName: DEFAULT_STAGE_PROPERTY,
      operator: 'IN',
      values: stageValues,
    },
  ];

  if (filter?.assignedTo) {
    const ownerId = normalizeHubSpotId(
      config.resolveOwnerId?.({
        assignedTo: filter.assignedTo,
        filter,
      }) ?? filter.assignedTo
    );

    if (!ownerId) {
      return [];
    }

    filters.push({
      propertyName: config.ownerPropertyName ?? DEFAULT_OWNER_PROPERTY,
      operator: 'EQ',
      value: ownerId,
    });
  }

  return filters;
}

function filterTicketsBySupportStatuses(
  tickets: readonly SupportTicket[],
  statuses: readonly SupportTicketStatus[] | undefined
): readonly SupportTicket[] {
  if (!statuses) {
    return tickets;
  }

  return tickets.filter(ticket => statuses.includes(ticket.status));
}

/**
 * Creates HubSpot-backed callback sets for the customer and admin support flows.
 *
 * HubSpot covers the ticket workflow, so this provider intentionally returns
 * callbacks instead of a full live-chat-capable SupportFlowAdapter.
 */
export function createHubSpotSupportFlowProvider(
  config: HubSpotSupportFlowProviderConfig
): HubSpotSupportFlowProvider {
  const requestFetch = getFetchImplementation(config.fetch);
  const baseUrl = trimTrailingSlash(config.baseUrl ?? DEFAULT_HUBSPOT_BASE_URL);
  const ticketsPath = `/${trimLeadingSlash(
    config.ticketsPath ?? DEFAULT_HUBSPOT_TICKETS_PATH
  )}`;
  const authorization = getAuthorizationHeader(config);
  const pageSize = getPageSize(config.pageSize);
  const requestedProperties = [
    DEFAULT_SUBJECT_PROPERTY,
    config.transcriptPropertyName ?? DEFAULT_TRANSCRIPT_PROPERTY,
    DEFAULT_STAGE_PROPERTY,
    DEFAULT_PRIORITY_PROPERTY,
    DEFAULT_PIPELINE_PROPERTY,
    config.ownerPropertyName ?? DEFAULT_OWNER_PROPERTY,
    DEFAULT_CREATED_AT_PROPERTY,
    DEFAULT_UPDATED_AT_PROPERTY,
    ...(config.customerEmailPropertyName
      ? [config.customerEmailPropertyName]
      : []),
    ...(config.tagsPropertyName ? [config.tagsPropertyName] : []),
    ...(config.liveChatOfferedPropertyName
      ? [config.liveChatOfferedPropertyName]
      : []),
  ];

  const requestHubSpot = async <T>(
    path: string,
    options: HubSpotRequestOptions = {}
  ): Promise<T> => {
    const response = await requestFetch(`${baseUrl}${path}`, {
      method: options.method ?? 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(authorization ? { Authorization: authorization } : {}),
        ...config.headers,
      },
      ...(options.body !== undefined
        ? { body: JSON.stringify(options.body) }
        : {}),
    });
    const data = await parseJsonResponse<T>(response);

    if (!response.ok) {
      throw new Error(
        extractHubSpotErrorMessage(
          data,
          `HubSpot support request failed with status ${response.status}.`
        )
      );
    }

    if (!data) {
      throw new Error('HubSpot support request returned an empty response.');
    }

    return data;
  };

  const readHubSpotTicket = async (
    reference: string
  ): Promise<HubSpotTicketRecord | null> => {
    const params = new URLSearchParams({
      properties: requestedProperties.join(','),
    });
    const ticketResponse = await requestHubSpot<HubSpotTicketResponse>(
      `${ticketsPath}/${encodeURIComponent(reference)}?${params.toString()}`
    );

    return ticketResponse.id ? ticketResponse : null;
  };

  const searchTickets = async (
    request: HubSpotSearchRequest
  ): Promise<readonly HubSpotTicketRecord[]> => {
    const searchResponse = await requestHubSpot<HubSpotSearchResponse>(
      `${ticketsPath}/search`,
      {
        method: 'POST',
        body: {
          properties: requestedProperties,
          sorts: [
            {
              propertyName: DEFAULT_UPDATED_AT_PROPERTY,
              direction: 'DESCENDING',
            },
          ],
          limit: pageSize,
          ...request,
        },
      }
    );

    return (searchResponse.results ?? []).filter(ticket => ticket.id);
  };

  const getTicket = async (
    reference: string,
    options: MapHubSpotTicketOptions = {}
  ): Promise<SupportTicket | null> => {
    const ticket = await readHubSpotTicket(reference);
    return ticket ? mapHubSpotTicket(ticket, config, options) : null;
  };

  const appendTicketMessage = async (
    input: AppendSupportTicketMessageInput
  ): Promise<SupportTicket> => {
    const currentTicket = await readHubSpotTicket(input.reference);

    if (!currentTicket) {
      throw new Error(`HubSpot ticket ${input.reference} not found.`);
    }

    const transcriptProperty =
      config.transcriptPropertyName ?? DEFAULT_TRANSCRIPT_PROPERTY;
    const currentContent = currentTicket.properties?.[transcriptProperty] ?? '';
    const ticketResponse = await requestHubSpot<HubSpotTicketResponse>(
      `${ticketsPath}/${encodeURIComponent(input.reference)}`,
      {
        method: 'PATCH',
        body: {
          properties: {
            [transcriptProperty]: appendTranscriptEntry(currentContent, input),
          },
        },
      }
    );

    if (!ticketResponse.id) {
      throw new Error(
        'HubSpot ticket message response did not include a ticket.'
      );
    }

    return mapHubSpotTicket(ticketResponse, config);
  };

  const userCallbacks: HubSpotSupportFlowProvider['userCallbacks'] = {
    createTicket: async input => {
      const ticketAssociations = createTicketAssociations(input, config);
      const ticketResponse = await requestHubSpot<HubSpotTicketResponse>(
        ticketsPath,
        {
          method: 'POST',
          body: {
            properties: createTicketProperties(input, config),
            ...(ticketAssociations ? { associations: ticketAssociations } : {}),
          },
        }
      );

      if (!ticketResponse.id) {
        throw new Error(
          'HubSpot ticket creation response did not include a ticket.'
        );
      }

      return mapHubSpotTicket(ticketResponse, config, {
        fallbackCustomer: input.customer,
        fallbackSummary: input.summary,
      });
    },
    getTicket,
    listTickets: async customer => {
      const customerFilter = createCustomerTicketFilter(customer, config);

      if (!customerFilter) {
        return [];
      }

      const tickets = await searchTickets({
        filterGroups: [
          {
            filters: [customerFilter],
          },
        ],
      });

      return tickets.map(ticket =>
        mapHubSpotTicket(ticket, config, {
          fallbackCustomer: customer,
        })
      );
    },
    appendTicketMessage,
  };

  const adminCallbacks: HubSpotSupportFlowProvider['adminCallbacks'] = {
    listTicketQueue: async filter => {
      const filters = createTicketQueueFilters(filter, config);

      if (filters.length === 0) {
        return [];
      }

      const tickets = (
        await searchTickets({
          filterGroups: [
            {
              filters,
            },
          ],
        })
      ).map(ticket => {
        return mapHubSpotTicket(ticket, config);
      });

      return filterTicketsBySupportStatuses(tickets, filter?.statuses);
    },
    getTicket,
    updateTicket: async input => {
      let ownerId: string | null | undefined;

      if (input.assignedTo === null) {
        ownerId = null;
      } else if (input.assignedTo !== undefined) {
        ownerId = normalizeHubSpotId(
          config.resolveOwnerId?.({
            assignedTo: input.assignedTo,
            input,
          }) ?? input.assignedTo
        );

        if (ownerId === undefined) {
          throw new Error(
            'HubSpot ticket assignment requires an owner id or a resolveOwnerId callback.'
          );
        }
      }

      const ticketResponse = await requestHubSpot<HubSpotTicketResponse>(
        `${ticketsPath}/${encodeURIComponent(input.reference)}`,
        {
          method: 'PATCH',
          body: {
            properties: createUpdateProperties(input, config, ownerId),
          },
        }
      );

      if (!ticketResponse.id) {
        throw new Error(
          'HubSpot ticket update response did not include a ticket.'
        );
      }

      return mapHubSpotTicket(ticketResponse, config);
    },
    appendTicketMessage,
  };

  return {
    userCallbacks,
    adminCallbacks,
  };
}
