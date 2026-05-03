import type {
  SupportTicket,
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
