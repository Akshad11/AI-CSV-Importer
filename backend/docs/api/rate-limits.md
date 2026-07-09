# Rate Limits Guide

This API enforces rate limiting on all endpoints to ensure fair usage and service stability.

---

## Current Rate Limit Policy

| Dimension | Value |
|:---|:---|
| **Window** | 15 minutes |
| **Max Requests** | 100 per window per IP |
| **Applied To** | All endpoints |
| **Scope** | Per IP address |
| **Algorithm** | Fixed window counter |

---

## Rate Limit Response Headers

Every response includes standard rate limit headers:

| Header | Description | Example |
|:---|:---|:---|
| `RateLimit-Limit` | Max requests allowed in window | `100` |
| `RateLimit-Remaining` | Requests remaining in window | `87` |
| `RateLimit-Reset` | Unix timestamp when window resets | `1720000000` |

When you are rate-limited (HTTP 429), an additional header is set:

| Header | Description |
|:---|:---|
| `Retry-After` | Seconds to wait before retrying |

---

## 429 Too Many Requests Response

```json
{
  "success": false,
  "message": "Too many requests. Please try again later."
}
```

---

## TypeScript: Reading Rate Limit Headers

```typescript
import axios, { AxiosResponse } from "axios";

interface RateLimitInfo {
  limit: number;
  remaining: number;
  resetAt: Date;
}

function extractRateLimitInfo(response: AxiosResponse): RateLimitInfo {
  return {
    limit: parseInt(response.headers["ratelimit-limit"] ?? "100"),
    remaining: parseInt(response.headers["ratelimit-remaining"] ?? "0"),
    resetAt: new Date(
      parseInt(response.headers["ratelimit-reset"] ?? "0") * 1000
    ),
  };
}
```

---

## Frontend Recommendations

### 1. Monitor Remaining Requests

```typescript
api.interceptors.response.use((response) => {
  const remaining = parseInt(response.headers["ratelimit-remaining"]);
  if (remaining < 10) {
    console.warn(`⚠️ Rate limit low: ${remaining} requests remaining`);
  }
  return response;
});
```

### 2. Handle 429 with Retry-After

```typescript
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 429) {
      const retryAfterSeconds = parseInt(
        error.response.headers["retry-after"] ?? "60"
      );
      console.warn(`Rate limited. Retrying in ${retryAfterSeconds}s`);
      await new Promise((r) => setTimeout(r, retryAfterSeconds * 1000));
      return api(error.config);          // Replay the request once
    }
    return Promise.reject(error);
  }
);
```

### 3. Show Countdown Timer to User

```tsx
function RetryCountdown({ retryAfterSeconds }: { retryAfterSeconds: number }) {
  const [seconds, setSeconds] = useState(retryAfterSeconds);

  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <p>
      Too many requests. Please wait <strong>{seconds}s</strong> before retrying.
    </p>
  );
}
```

---

## Planned: Endpoint-Specific Limits

In a future release, upload endpoints will have tighter per-endpoint limits:

| Endpoint | Planned Limit | Window |
|:---|:---|:---|
| `POST /api/v1/importer/upload` | 10 req | 15 min |
| `GET /api/v1/importer/status` | 120 req | 15 min |
| `GET /health` | Unlimited | — |
