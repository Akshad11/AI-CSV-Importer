# Pagination Guide

> **Current State**: v1.0.0 endpoints do not return paginated lists. This document describes the pagination contract that will be implemented in v1.1+ when list endpoints are added.

---

## Planned: Cursor Pagination (Default)

Cursor-based pagination is stateless, performant, and consistent even when data changes during iteration. This will be the **default** for all list endpoints.

### Query Parameters

| Parameter | Type | Default | Description |
|:---|:---|:---|:---|
| `cursor` | `string` | — | Opaque cursor from previous response |
| `limit` | `number` | `20` | Items per page (max: 100) |
| `sort` | `string` | `createdAt:desc` | Sort field and direction |

### Response Shape

```typescript
interface PaginatedResponse<T> {
  success: true;
  message: string;
  data: T[];
  meta: {
    cursor: {
      next: string | null;   // Pass as ?cursor= in next request
      prev: string | null;   // Null on first page
      hasMore: boolean;
    };
    limit: number;
    total?: number;          // Only included when feasible
  };
}
```

### Example Response

```json
{
  "success": true,
  "message": "Imports retrieved.",
  "data": [
    { "importId": "abc-001", "status": "completed", "createdAt": "2026-07-10T00:00:00Z" },
    { "importId": "abc-002", "status": "failed",    "createdAt": "2026-07-09T23:00:00Z" }
  ],
  "meta": {
    "cursor": {
      "next": "eyJpZCI6ImFiYy0wMDIifQ==",
      "prev": null,
      "hasMore": true
    },
    "limit": 20
  }
}
```

---

## Planned: Offset Pagination (Optional)

Available for admin export tools where offset is required.

### Query Parameters

| Parameter | Type | Default | Description |
|:---|:---|:---|:---|
| `page` | `number` | `1` | Page number (1-indexed) |
| `perPage` | `number` | `20` | Items per page (max: 100) |

```typescript
interface OffsetPaginatedResponse<T> {
  success: true;
  message: string;
  data: T[];
  meta: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}
```

---

## Filtering

All list endpoints will support query string filters:

| Parameter | Example | Description |
|:---|:---|:---|
| `status` | `?status=completed` | Filter by import status |
| `from` | `?from=2026-07-01` | Filter by start date |
| `to` | `?to=2026-07-31` | Filter by end date |
| `provider` | `?provider=openai` | Filter by AI provider |

---

## Sorting

```
?sort=createdAt:desc    # newest first (default)
?sort=createdAt:asc     # oldest first
?sort=totalRows:desc    # largest imports first
?sort=duration:asc      # fastest imports first
```

---

## React: Cursor-Paginated List

```typescript
import { useInfiniteQuery } from "@tanstack/react-query";
import axios from "axios";

function useImportList() {
  return useInfiniteQuery({
    queryKey: ["imports"],
    queryFn: async ({ pageParam: cursor }) => {
      const params = cursor ? `?cursor=${cursor}&limit=20` : "?limit=20";
      const { data } = await axios.get(`/api/v1/importer/list${params}`);
      return data;
    },
    getNextPageParam: (lastPage) =>
      lastPage.meta.cursor.hasMore ? lastPage.meta.cursor.next : undefined,
    initialPageParam: undefined,
  });
}
```
