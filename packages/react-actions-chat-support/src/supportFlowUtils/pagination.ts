export interface SupportPaginationPage<TItem> {
  readonly visibleItems: readonly TItem[];
  readonly pageIndex: number;
  readonly currentPage: number;
  readonly pageCount: number;
  readonly pageSize: number;
  readonly totalItems: number;
  readonly firstVisibleItemNumber: number;
  readonly lastVisibleItemNumber: number;
}

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
