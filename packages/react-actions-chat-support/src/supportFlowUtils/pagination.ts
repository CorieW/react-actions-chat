import type {
  SupportTicket,
  SupportTicketListRequest,
  SupportTicketListResponse,
  SupportTicketListResult,
} from '../supportFlowTypes';

/**
 * Paginated result shape for support pagination.
 */
export interface SupportPaginationPage<TItem> {
  /**
   * Items visible in the current view.
   */
  readonly visibleItems: readonly TItem[];
  /**
   * Zero-based page index currently being rendered.
   */
  readonly pageIndex: number;
  /**
   * One-based page number currently being rendered.
   */
  readonly currentPage: number;
  /**
   * Total number of pages available.
   */
  readonly pageCount: number;
  /**
   * Number of items shown per page.
   */
  readonly pageSize: number;
  /**
   * Zero-based item offset for the first visible entry.
   */
  readonly offset: number;
  /**
   * Total number of items before pagination is applied.
   */
  readonly totalItems: number;
  /**
   * Whether totalItems is the exact total rather than a lower bound.
   */
  readonly isTotalItemsExact: boolean;
  /**
   * Whether another page is available after the current page.
   */
  readonly hasMoreItems: boolean;
  /**
   * One-based item number for the first visible entry on the page.
   */
  readonly firstVisibleItemNumber: number;
  /**
   * One-based item number for the last visible entry on the page.
   */
  readonly lastVisibleItemNumber: number;
}

/**
 * Options used to create a pagination page from an externally paged result.
 */
interface CreatePaginationPageOptions<TItem> {
  /**
   * Items visible in the current view.
   */
  readonly visibleItems: readonly TItem[];
  /**
   * Zero-based page index currently being rendered.
   */
  readonly pageIndex: number;
  /**
   * Optional number of items requested for the current page.
   */
  readonly pageSize?: number | undefined;
  /**
   * Zero-based item offset for the first visible entry.
   */
  readonly offset?: number | undefined;
  /**
   * Exact total number of items before pagination when the backend knows it.
   */
  readonly totalItems?: number | undefined;
  /**
   * Whether another page is available after the current page.
   */
  readonly hasMoreItems?: boolean | undefined;
}

/**
 * Options used to collect locally filtered tickets from a paged backend.
 */
interface CollectFilteredSupportTicketListOptions {
  /**
   * Zero-based page index requested by the current support flow.
   */
  readonly pageIndex: number;
  /**
   * Optional number of tickets requested by each backend page and shown in one UI page.
   */
  readonly pageSize?: number | undefined;
  /**
   * Lists tickets for one backend page.
   *
   * @param request - Paging metadata sent to the ticket-listing backend.
   */
  readonly listTickets: (
    request: SupportTicketListRequest
  ) => Promise<SupportTicketListResponse>;
  /**
   * Applies the local filter predicate to one backend page of tickets.
   *
   * @param tickets - Backend tickets to filter.
   */
  readonly filterTickets: (
    tickets: readonly SupportTicket[]
  ) => readonly SupportTicket[];
}

/**
 * Locally filtered ticket-list result with pagination metadata.
 */
interface FilteredSupportTicketListPage {
  /**
   * All tickets that matched the local predicate.
   */
  readonly tickets: readonly SupportTicket[];
  /**
   * UI page derived from the filtered ticket list.
   */
  readonly page: SupportPaginationPage<SupportTicket>;
}

/**
 * Returns whether a ticket listing response includes backend pagination metadata.
 *
 * @param response - Ticket listing response returned by an adapter or callback.
 */
export function isSupportTicketListResult(
  response: SupportTicketListResponse
): response is SupportTicketListResult {
  return !Array.isArray(response);
}

/**
 * Returns the tickets contained in either supported ticket-list response shape.
 *
 * @param response - Ticket listing response returned by an adapter or callback.
 */
export function getSupportTicketListTickets(
  response: SupportTicketListResponse
): readonly SupportTicket[] {
  return isSupportTicketListResult(response) ? response.tickets : response;
}

/**
 * Creates a ticket-list request for one backend page.
 *
 * @param pageIndex - Zero-based page index requested by the flow.
 * @param offset - Zero-based ticket offset requested from the backend.
 * @param pageSize - Optional number of tickets the backend should return.
 */
export function createSupportTicketListRequest(
  pageIndex: number,
  offset: number,
  pageSize?: number
): SupportTicketListRequest {
  return {
    pageIndex,
    offset,
    ...(pageSize !== undefined ? { pageSize, limit: pageSize } : {}),
  };
}

/**
 * Returns the next offset implied by a paged ticket-list response.
 *
 * @param request - Ticket-list request that produced the response.
 * @param result - Paged ticket-list response returned by the backend.
 */
export function getSupportTicketListNextOffset(
  request: SupportTicketListRequest,
  result: SupportTicketListResult
): number | undefined {
  const fallbackOffset = request.offset + result.tickets.length;
  const totalTickets =
    result.totalTickets !== undefined
      ? Math.max(0, Math.floor(result.totalTickets))
      : undefined;
  const hasMoreByTotal =
    totalTickets !== undefined ? fallbackOffset < totalTickets : undefined;

  if (result.hasMore === false || hasMoreByTotal === false) {
    return undefined;
  }

  if (result.nextOffset !== undefined && result.nextOffset > request.offset) {
    return result.nextOffset;
  }

  if (result.hasMore === true || hasMoreByTotal === true) {
    return fallbackOffset > request.offset ? fallbackOffset : undefined;
  }

  return undefined;
}

/**
 * Returns whether a paged ticket-list response can advance to another page.
 *
 * @param request - Ticket-list request that produced the response.
 * @param result - Paged ticket-list response returned by the backend.
 */
export function hasSupportTicketListNextPage(
  request: SupportTicketListRequest,
  result: SupportTicketListResult
): boolean {
  return getSupportTicketListNextOffset(request, result) !== undefined;
}

/**
 * Returns the UI page size requested for a paged ticket response.
 *
 * @param request - Ticket-list request that produced the response.
 * @param fallbackPageSize - Configured UI page size for the current list.
 * @param visibleItemCount - Number of items returned by the backend response.
 */
export function getSupportTicketListPageSize(
  request: SupportTicketListRequest,
  fallbackPageSize: number | undefined,
  visibleItemCount: number
): number {
  return (
    request.pageSize ?? request.limit ?? fallbackPageSize ?? visibleItemCount
  );
}

/**
 * Normalizes a requested page size into a positive integer.
 *
 * @param pageSize - Optional page size requested by the flow or backend.
 * @param fallbackPageSize - Page size to use when the requested value is not finite.
 */
function normalizePageSize(
  pageSize: number | undefined,
  fallbackPageSize: number
): number {
  const requestedPageSize = pageSize ?? fallbackPageSize;

  return Math.max(
    1,
    Number.isFinite(requestedPageSize)
      ? Math.floor(requestedPageSize)
      : Math.max(1, fallbackPageSize)
  );
}

/**
 * Creates a bounded page result from an externally paged list response.
 *
 * @param options - Options used to describe the externally paged result.
 */
export function createPaginationPage<TItem>({
  visibleItems,
  pageIndex,
  pageSize,
  offset = 0,
  totalItems,
  hasMoreItems,
}: CreatePaginationPageOptions<TItem>): SupportPaginationPage<TItem> {
  const safePageIndex = Math.max(0, Math.floor(pageIndex));
  const safeOffset = Math.max(0, Math.floor(offset));
  const safePageSize = normalizePageSize(pageSize, visibleItems.length || 1);
  const knownVisibleTotal = safeOffset + visibleItems.length;
  const safeTotalItems =
    totalItems !== undefined
      ? Math.max(0, Math.floor(totalItems))
      : knownVisibleTotal + (hasMoreItems ? 1 : 0);
  const resolvedHasMoreItems =
    hasMoreItems ??
    (totalItems !== undefined && knownVisibleTotal < safeTotalItems);
  const isTotalItemsExact = totalItems !== undefined || !resolvedHasMoreItems;
  const totalPageCount = Math.max(1, Math.ceil(safeTotalItems / safePageSize));
  const minimumPageCount = safePageIndex + 1 + (resolvedHasMoreItems ? 1 : 0);
  const pageCount = resolvedHasMoreItems
    ? Math.max(totalPageCount, minimumPageCount)
    : safePageIndex + 1;

  return {
    visibleItems,
    pageIndex: safePageIndex,
    currentPage: safePageIndex + 1,
    pageCount,
    pageSize: safePageSize,
    offset: safeOffset,
    totalItems: safeTotalItems,
    isTotalItemsExact,
    hasMoreItems: resolvedHasMoreItems,
    firstVisibleItemNumber: visibleItems.length ? safeOffset + 1 : 0,
    lastVisibleItemNumber: knownVisibleTotal,
  };
}

/**
 * Collects only the backend pages needed to apply a local ticket predicate for one UI page.
 *
 * @param options - Options used to fetch, filter, and paginate tickets.
 */
export async function collectFilteredSupportTicketListPage({
  pageIndex,
  pageSize,
  listTickets,
  filterTickets,
}: CollectFilteredSupportTicketListOptions): Promise<FilteredSupportTicketListPage> {
  if (pageSize === undefined) {
    const filteredTickets = await collectAllFilteredSupportTickets({
      listTickets,
      filterTickets,
      pageSize,
    });

    return {
      tickets: filteredTickets,
      page: paginateItems(filteredTickets, pageIndex, pageSize),
    };
  }

  const safePageIndex = Math.max(0, Math.floor(pageIndex));
  const safePageSize = normalizePageSize(pageSize, 1);
  const firstVisibleItemIndex = safePageIndex * safePageSize;
  const visibleItemLimit = firstVisibleItemIndex + safePageSize;
  const collectedItemLimit = visibleItemLimit + 1;
  const filteredTickets: SupportTicket[] = [];
  const seenOffsets = new Set<number>();
  let backendPageIndex = 0;
  let offset = 0;
  let exhausted = false;

  while (
    !seenOffsets.has(offset) &&
    filteredTickets.length < collectedItemLimit
  ) {
    seenOffsets.add(offset);

    const request = createSupportTicketListRequest(
      backendPageIndex,
      offset,
      safePageSize
    );
    const response = await listTickets(request);
    filteredTickets.push(
      ...filterTickets(getSupportTicketListTickets(response))
    );

    if (!isSupportTicketListResult(response)) {
      exhausted = true;
      break;
    }

    const nextOffset = getSupportTicketListNextOffset(request, response);

    if (nextOffset === undefined) {
      exhausted = true;
      break;
    }

    offset = nextOffset;
    backendPageIndex += 1;
  }

  if (exhausted) {
    return {
      tickets: filteredTickets,
      page: paginateItems(filteredTickets, safePageIndex, safePageSize),
    };
  }

  const visibleItems = filteredTickets.slice(
    firstVisibleItemIndex,
    visibleItemLimit
  );

  return {
    tickets: filteredTickets.slice(0, visibleItemLimit),
    page: createPaginationPage({
      visibleItems,
      pageIndex: safePageIndex,
      pageSize: safePageSize,
      offset: firstVisibleItemIndex,
      hasMoreItems: filteredTickets.length > visibleItemLimit,
    }),
  };
}

/**
 * Collects every backend page so unlimited filtered views can show all matches.
 *
 * @param options - Options used to fetch and filter tickets.
 */
async function collectAllFilteredSupportTickets({
  pageSize,
  listTickets,
  filterTickets,
}: Omit<CollectFilteredSupportTicketListOptions, 'pageIndex'>): Promise<
  readonly SupportTicket[]
> {
  const filteredTickets: SupportTicket[] = [];
  const seenOffsets = new Set<number>();
  let backendPageIndex = 0;
  let offset = 0;

  while (!seenOffsets.has(offset)) {
    seenOffsets.add(offset);

    const request = createSupportTicketListRequest(
      backendPageIndex,
      offset,
      pageSize
    );
    const response = await listTickets(request);
    filteredTickets.push(
      ...filterTickets(getSupportTicketListTickets(response))
    );

    if (!isSupportTicketListResult(response)) {
      break;
    }

    const nextOffset = getSupportTicketListNextOffset(request, response);

    if (nextOffset === undefined) {
      break;
    }

    offset = nextOffset;
    backendPageIndex += 1;
  }

  return filteredTickets;
}

/**
 * Paginates items into a bounded page result.
 *
 * @param items - Items to paginate.
 * @param pageIndex - Zero-based page index to display.
 * @param pageSize - Optional number of items to show per page.
 */
export function paginateItems<TItem>(
  items: readonly TItem[],
  pageIndex: number,
  pageSize?: number
): SupportPaginationPage<TItem> {
  const safePageSize = normalizePageSize(pageSize, items.length || 1);
  const pageCount = Math.max(1, Math.ceil(items.length / safePageSize));
  const safePageIndex = Math.min(Math.max(0, pageIndex), pageCount - 1);
  const firstVisibleItemIndex = safePageIndex * safePageSize;
  const visibleItems = items.slice(
    firstVisibleItemIndex,
    firstVisibleItemIndex + safePageSize
  );

  return {
    visibleItems,
    pageIndex: safePageIndex,
    currentPage: safePageIndex + 1,
    pageCount,
    pageSize: safePageSize,
    offset: firstVisibleItemIndex,
    totalItems: items.length,
    isTotalItemsExact: true,
    hasMoreItems: safePageIndex < pageCount - 1,
    firstVisibleItemNumber: firstVisibleItemIndex + 1,
    lastVisibleItemNumber: firstVisibleItemIndex + visibleItems.length,
  };
}
