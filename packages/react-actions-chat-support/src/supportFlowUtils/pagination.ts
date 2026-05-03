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
   * Total number of items before pagination is applied.
   */
  readonly totalItems: number;
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
  const requestedPageSize = pageSize ?? items.length;
  const safePageSize = Math.max(
    1,
    Number.isFinite(requestedPageSize)
      ? Math.floor(requestedPageSize)
      : items.length
  );
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
    totalItems: items.length,
    firstVisibleItemNumber: firstVisibleItemIndex + 1,
    lastVisibleItemNumber: firstVisibleItemIndex + visibleItems.length,
  };
}
