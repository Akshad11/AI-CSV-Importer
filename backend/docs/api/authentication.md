# Authentication Guide

> **Current Version**: API key authentication is in active development. The current `v1.0.0` backend accepts unauthenticated requests (suitable for internal network / trusted environments). This document covers the current state and the planned JWT/API-key implementation.

---

## Current State (v1.0.0)

The current API does **not** require authentication tokens for `v1` endpoints. All requests are accepted from any origin. This is intentional for the initial internal release.

> [!WARNING]
> Do not expose this API on a public internet without adding the authentication layer described in the **Planned** section below.

---

## Response Headers (Always Present)

Regardless of auth state, every response carries:

```
X-Request-Id: 550e8400-e29b-41d4-a716-446655440000
```

Use this to correlate requests across your frontend, backend logs, and support tickets.

---

## Planned: JWT Authentication Flow

The planned authentication system will use short-lived **JWT access tokens** and **refresh tokens**.

### Flow Diagram

```mermaid
sequenceDiagram
    participant C as Client
    participant API as API Server
    participant Auth as Auth Service

    C->>API: POST /api/v1/auth/login { email, password }
    API->>Auth: Validate credentials
    Auth-->>API: Valid
    API-->>C: { accessToken, refreshToken, expiresIn }

    C->>API: GET /api/v1/importer/upload\nAuthorization: Bearer <accessToken>
    API->>Auth: Verify token
    Auth-->>API: Token valid
    API-->>C: 200 OK + data

    Note over C,API: Token expires after 15 minutes

    C->>API: POST /api/v1/auth/refresh\n{ refreshToken }
    API-->>C: { accessToken, expiresIn }
```

---

## Planned: Request Headers (JWT)

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
Accept: application/json
```

---

## Planned: TypeScript Interfaces

```typescript
// Login request
interface LoginRequest {
  email: string;
  password: string;
}

// Auth response
interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;       // seconds until accessToken expires
  tokenType: "Bearer";
}

// Token refresh request
interface RefreshTokenRequest {
  refreshToken: string;
}

// Token claims (decoded JWT payload)
interface TokenClaims {
  sub: string;             // user ID
  email: string;
  roles: string[];
  iat: number;             // issued at
  exp: number;             // expires at
}
```

---

## Planned: 401 / 403 Handling

| Status | Code | Meaning | Frontend Action |
|:---|:---|:---|:---|
| `401` | `UNAUTHORIZED` | No token or token is invalid | Redirect to login |
| `401` | `TOKEN_EXPIRED` | Access token has expired | Call refresh endpoint |
| `403` | `FORBIDDEN` | Authenticated but lacks permission | Show permission error |
| `403` | `INSUFFICIENT_SCOPE` | Token scope doesn't cover this resource | Contact admin |

---

## Planned: Automatic Token Refresh (Axios Interceptor)

```typescript
import axios from "axios";

const api = axios.create({ baseURL: process.env.NEXT_PUBLIC_API_URL });

// Attach token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 and refresh automatically
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refreshToken = localStorage.getItem("refreshToken");
      try {
        const { data } = await axios.post("/api/v1/auth/refresh", { refreshToken });
        localStorage.setItem("accessToken", data.accessToken);
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch {
        localStorage.clear();
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);
```

---

## Planned: API Key Authentication (Machine-to-Machine)

Server-to-server integrations will support static API keys via header:

```http
X-API-Key: csvcrm_live_sk_1234567890abcdef
```

API keys will have configurable scopes:
- `import:read` — read import status
- `import:write` — create imports
- `admin:all` — full access

---

## Current: No-Auth Client Setup

For the current unauthenticated v1 API, set up your client like this:

```typescript
// api/client.ts
import axios from "axios";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000",
  timeout: 30_000,
  headers: {
    "Accept": "application/json",
  },
});

// Add request ID to every outgoing request for debugging
api.interceptors.request.use((config) => {
  config.headers["X-Client-Request-Id"] = crypto.randomUUID();
  return config;
});
```
