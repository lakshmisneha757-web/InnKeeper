export type Module5ListResponse<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
};

export function normalizeListResponse<T>(payload: unknown): Module5ListResponse<T> {
  if (Array.isArray(payload)) {
    const items = payload as T[];
    return { items, total: items.length, page: 1, limit: items.length, pages: 1 };
  }

  if (payload && typeof payload === "object") {
    const data = payload as Record<string, unknown>;
    const items = Array.isArray(data.items) ? (data.items as T[]) : [];
    return {
      items,
      total: typeof data.total === "number" ? data.total : items.length,
      page: typeof data.page === "number" ? data.page : 1,
      limit: typeof data.limit === "number" ? data.limit : items.length,
      pages: typeof data.pages === "number" ? data.pages : 1,
    };
  }

  return { items: [], total: 0, page: 1, limit: 20, pages: 0 };
}

export function sortRows<T>(rows: T[], sortBy: string, sortOrder: "asc" | "desc") {
  if (!sortBy) return rows;

  const sorted = [...rows].sort((a: any, b: any) => {
    const first = a?.[sortBy];
    const second = b?.[sortBy];

    if (first == null && second == null) return 0;
    if (first == null) return 1;
    if (second == null) return -1;

    const left = typeof first === "string" ? first.toLowerCase() : first;
    const right = typeof second === "string" ? second.toLowerCase() : second;

    if (left < right) return sortOrder === "asc" ? -1 : 1;
    if (left > right) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });

  return sorted;
}

export function filterRows<T>(rows: T[], search: string, filterValue: string, getSearchText: (row: T) => string) {
  const query = search.trim().toLowerCase();

  return rows.filter((row) => {
    const searchText = getSearchText(row).toLowerCase();
    const matchesSearch = !query || searchText.includes(query);
    const matchesFilter = filterValue === "all" || searchText.includes(filterValue.toLowerCase());
    return matchesSearch && matchesFilter;
  });
}

export function exportRowsToCsv<T>(
  rows: T[],
  columns: Array<{ key: string; label: string; render?: (row: T) => string | number | boolean | null | undefined }>
) {
  const header = columns.map((column) => column.label).join(",");
  const lines = rows.map((row) =>
    columns
      .map((column) => {
        const value = column.render ? column.render(row) : (row as Record<string, unknown>)[column.key];
        const normalized = value == null ? "" : String(value).replace(/\n/g, " ").replace(/"/g, '""');
        return `"${normalized}"`;
      })
      .join(",")
  );

  return [header, ...lines].join("\n");
}
