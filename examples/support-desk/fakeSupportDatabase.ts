import {
  createInMemorySupportFlowAdapter,
  type AppendSupportLiveChatMessageInput,
  type AppendSupportTicketMessageInput,
  type CreateSupportTicketInput,
  type InMemorySupportFlowAdapterOptions,
  type StartSupportLiveChatInput,
  type SupportFlowAdapter,
  type SupportLiveChatQueueFilter,
  type SupportQueueFilter,
  type SupportTicket,
  type SupportTicketListRequest,
  type SupportTicketListResponse,
  type SupportTicketListResult,
  type SupportUserIdentity,
  type UpdateSupportLiveChatInput,
  type UpdateSupportTicketInput,
} from 'react-actions-chat-support';

/**
 * Maximum number of ticket rows the fake database can return from one read.
 */
export const FAKE_DATABASE_MAX_TICKET_ROWS = 2;

/**
 * Minimum fake database response delay in milliseconds.
 */
const FAKE_DATABASE_MIN_RESPONSE_MS = 200;

/**
 * Extra fake database response delay added to read operations in milliseconds.
 */
const FAKE_DATABASE_READ_RESPONSE_MS = 200;

/**
 * Extra fake database response delay added to write operations in milliseconds.
 */
const FAKE_DATABASE_WRITE_RESPONSE_MS = 200;

/**
 * Options used to create the support example fake database.
 */
export interface FakeSupportDatabaseOptions {
  /**
   * Seed and factory options passed to the internal in-memory backing store.
   */
  readonly adapterOptions: InMemorySupportFlowAdapterOptions;
}

/**
 * Support example fake database that follows the support adapter contract.
 */
export type FakeSupportDatabase = SupportFlowAdapter;

/**
 * Waits for a fake database operation to finish.
 *
 * @param extraDelayMs - Additional latency that represents the current operation cost.
 */
async function waitForFakeDatabase(extraDelayMs: number): Promise<void> {
  await new Promise(resolve => {
    globalThis.setTimeout(
      resolve,
      FAKE_DATABASE_MIN_RESPONSE_MS + extraDelayMs
    );
  });
}

/**
 * Applies the fake database ticket row limit to a requested page size.
 *
 * @param request - Optional paging request from the support flow.
 */
function resolveTicketLimit(request?: SupportTicketListRequest): number {
  return Math.min(
    request?.limit ?? FAKE_DATABASE_MAX_TICKET_ROWS,
    FAKE_DATABASE_MAX_TICKET_ROWS
  );
}

/**
 * Returns a fake database page from a complete in-memory ticket result.
 *
 * @param tickets - Matching tickets available in the backing store.
 * @param request - Optional paging request from the support flow.
 */
function pageTickets(
  tickets: readonly SupportTicket[],
  request?: SupportTicketListRequest
): SupportTicketListResult {
  const offset = Math.max(0, request?.offset ?? 0);
  const limit = resolveTicketLimit(request);
  const nextOffset = offset + limit;

  return {
    tickets: tickets.slice(offset, nextOffset),
    totalTickets: tickets.length,
    hasMore: nextOffset < tickets.length,
    nextOffset,
  };
}

/**
 * Extracts ticket rows from either ticket-list response shape.
 *
 * @param response - Ticket list response returned by the backing adapter.
 */
function getTicketRows(
  response: SupportTicketListResponse
): readonly SupportTicket[] {
  return Array.isArray(response)
    ? response
    : (response as SupportTicketListResult).tickets;
}

/**
 * Creates a limited fake database for the support-desk example.
 *
 * @param options - Seed data and factory options for the fake database.
 */
export function createFakeSupportDatabase({
  adapterOptions,
}: FakeSupportDatabaseOptions): FakeSupportDatabase {
  const backingAdapter = createInMemorySupportFlowAdapter(adapterOptions);

  return {
    /**
     * Creates a ticket after the fake write latency has elapsed.
     *
     * @param input - Ticket creation payload from the customer support flow.
     */
    async createTicket(input: CreateSupportTicketInput) {
      await waitForFakeDatabase(FAKE_DATABASE_WRITE_RESPONSE_MS);
      return backingAdapter.createTicket(input);
    },

    /**
     * Reads one ticket by reference after the fake read latency has elapsed.
     *
     * @param reference - Ticket reference to look up in the fake database.
     */
    async getTicketByReference(reference: string) {
      await waitForFakeDatabase(FAKE_DATABASE_READ_RESPONSE_MS);
      return backingAdapter.getTicketByReference(reference);
    },

    /**
     * Lists a customer's tickets with a hard two-row database response cap.
     *
     * @param customer - Customer identity used to filter tickets.
     * @param request - Optional paging request from the support flow.
     */
    async listCustomerTickets(
      customer: SupportUserIdentity,
      request?: SupportTicketListRequest
    ) {
      await waitForFakeDatabase(FAKE_DATABASE_READ_RESPONSE_MS);
      return pageTickets(
        getTicketRows(await backingAdapter.listCustomerTickets(customer)),
        request
      );
    },

    /**
     * Lists the admin ticket queue with a hard two-row database response cap.
     *
     * @param filter - Optional queue filter from the admin support flow.
     * @param request - Optional paging request from the support flow.
     */
    async listQueue(
      filter?: SupportQueueFilter,
      request?: SupportTicketListRequest
    ) {
      await waitForFakeDatabase(FAKE_DATABASE_READ_RESPONSE_MS);
      return pageTickets(
        getTicketRows(await backingAdapter.listQueue(filter)),
        request
      );
    },

    /**
     * Lists live-chat sessions after fake read latency.
     *
     * @param filter - Optional live-chat queue filter from the admin flow.
     */
    async listLiveChatQueue(filter?: SupportLiveChatQueueFilter) {
      await waitForFakeDatabase(FAKE_DATABASE_READ_RESPONSE_MS);
      return backingAdapter.listLiveChatQueue(filter);
    },

    /**
     * Reads one live-chat session after fake read latency.
     *
     * @param sessionId - Live-chat session identifier to look up.
     */
    async getLiveChatById(sessionId: string) {
      await waitForFakeDatabase(FAKE_DATABASE_READ_RESPONSE_MS);
      return backingAdapter.getLiveChatById(sessionId);
    },

    /**
     * Lists live-chat sessions for one customer after fake read latency.
     *
     * @param customer - Customer identity used to filter live chats.
     */
    async listCustomerLiveChats(customer: SupportUserIdentity) {
      await waitForFakeDatabase(FAKE_DATABASE_READ_RESPONSE_MS);
      return backingAdapter.listCustomerLiveChats(customer);
    },

    /**
     * Updates a ticket after the fake write latency has elapsed.
     *
     * @param input - Ticket update payload from the admin support flow.
     */
    async updateTicket(input: UpdateSupportTicketInput) {
      await waitForFakeDatabase(FAKE_DATABASE_WRITE_RESPONSE_MS);
      return backingAdapter.updateTicket(input);
    },

    /**
     * Appends ticket activity after the fake write latency has elapsed.
     *
     * @param input - Ticket message payload from a customer or admin flow.
     */
    async appendTicketMessage(input: AppendSupportTicketMessageInput) {
      await waitForFakeDatabase(FAKE_DATABASE_WRITE_RESPONSE_MS);
      return backingAdapter.appendTicketMessage(input);
    },

    /**
     * Starts a live-chat session after the fake write latency has elapsed.
     *
     * @param input - Live-chat start payload from a customer or admin flow.
     */
    async startLiveChat(input: StartSupportLiveChatInput) {
      await waitForFakeDatabase(FAKE_DATABASE_WRITE_RESPONSE_MS);
      return backingAdapter.startLiveChat(input);
    },

    /**
     * Updates a live-chat session after the fake write latency has elapsed.
     *
     * @param input - Live-chat update payload from a customer or admin flow.
     */
    async updateLiveChat(input: UpdateSupportLiveChatInput) {
      await waitForFakeDatabase(FAKE_DATABASE_WRITE_RESPONSE_MS);
      return backingAdapter.updateLiveChat(input);
    },

    /**
     * Appends a live-chat transcript message after fake write latency.
     *
     * @param input - Live-chat message payload from a customer or admin flow.
     */
    async appendLiveChatMessage(input: AppendSupportLiveChatMessageInput) {
      await waitForFakeDatabase(FAKE_DATABASE_WRITE_RESPONSE_MS);
      return backingAdapter.appendLiveChatMessage(input);
    },
  };
}
