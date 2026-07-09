# Complete Error Reference

Every error response from this API conforms to the standard error envelope:

```json
{
  "success": false,
  "code": "ERROR_CODE",
  "message": "Human-readable description",
  "errors": null
}
```

The `errors` field contains structured validation details when the error is a `VALIDATION_ERROR` from Zod.

---

## TypeScript: Error Response Interface

```typescript
interface ApiErrorResponse {
  success: false;
  code: string;
  message: string;
  errors: ZodValidationErrors | null;
}

interface ZodValidationErrors {
  formErrors: string[];
  fieldErrors: Record<string, string[] | undefined>;
}

// Type guard
function isApiError(response: unknown): response is ApiErrorResponse {
  return (
    typeof response === "object" &&
    response !== null &&
    "success" in response &&
    (response as ApiErrorResponse).success === false
  );
}
```

---

## HTTP Status Codes

| Code | Name | When Used |
|:---|:---|:---|
| `200` | OK | Request succeeded |
| `400` | Bad Request | Client validation error (file type, missing field) |
| `401` | Unauthorized | Token missing or invalid (planned auth) |
| `403` | Forbidden | Authenticated but lacks permission (planned auth) |
| `404` | Not Found | Resource or endpoint doesn't exist |
| `413` | Payload Too Large | File exceeds 5MB limit |
| `429` | Too Many Requests | Rate limit exceeded |
| `500` | Internal Server Error | Unexpected server-side failure |
| `503` | Service Unavailable | AI provider is down |

---

## Error Code Reference

### Upload Errors

| Code | HTTP | Cause | User Message | Frontend Action |
|:---|:---|:---|:---|:---|
| `CSV_FILE_REQUIRED` | 400 | No file attached to request | "Please select a CSV file to upload." | Show file picker with error state |
| `INVALID_FILE_EXTENSION` | 400 | File extension is not `.csv` | "Only .csv files are accepted." | Highlight file input, show allowed types |
| `INVALID_FILE_TYPE` | 400 | MIME type not `text/csv` or `application/vnd.ms-excel` | "This file format is not supported." | Prompt user to export as CSV |
| `FILE_TOO_LARGE` | 413 | File is larger than 5MB | "File is too large. Maximum size is 5MB." | Show size reducer tips |

### Rate Limit Errors

| Code | HTTP | Cause | User Message | Frontend Action |
|:---|:---|:---|:---|:---|
| `RATE_LIMIT_EXCEEDED` | 429 | More than 100 requests in 15 minutes | "You're doing that too fast. Please wait." | Show `Retry-After` countdown timer |

### Validation Errors (Zod)

| Code | HTTP | Cause | User Message | Frontend Action |
|:---|:---|:---|:---|:---|
| `VALIDATION_ERROR` | 400 | Request body fails schema validation | "Please check the fields below." | Display `errors.fieldErrors` beneath form inputs |

### AI Provider Errors

| Code | HTTP | Cause | User Message | Frontend Action |
|:---|:---|:---|:---|:---|
| `AI_PROVIDER_ERROR` | 503 | AI provider returned an error | "AI processing is temporarily unavailable." | Retry after delay |
| `AI_RATE_LIMITED` | 429 | AI provider rate limit hit | "Processing is temporarily paused." | Show progress with pause indicator |
| `AI_RESPONSE_INVALID` | 500 | AI returned malformed response | "Processing failed. Please try again." | Retry or re-upload |
| `AI_RETRY_EXHAUSTED` | 503 | All retry attempts failed | "Processing could not complete. Try again later." | Allow manual retry |

### System Errors

| Code | HTTP | Cause | User Message | Frontend Action |
|:---|:---|:---|:---|:---|
| `INTERNAL_SERVER_ERROR` | 500 | Unexpected server exception | "Something went wrong on our end." | Show support contact |
| `NOT_FOUND` | 404 | Endpoint or resource not found | "This resource was not found." | Redirect to home |

---

## Validation Error Format (Zod)

When a request body fails Zod schema validation, `errors` will contain a structured object:

```json
{
  "success": false,
  "code": "VALIDATION_ERROR",
  "message": "Validation failed",
  "errors": {
    "formErrors": [],
    "fieldErrors": {
      "email": ["Invalid email address"],
      "provider": ["Expected 'openai' | 'gemini' | 'claude', received 'gpt5'"]
    }
  }
}
```

### Rendering Validation Errors in React

```tsx
interface FieldErrors {
  [field: string]: string[] | undefined;
}

function ValidationErrorList({ fieldErrors }: { fieldErrors: FieldErrors }) {
  return (
    <ul className="error-list">
      {Object.entries(fieldErrors).map(([field, messages]) =>
        messages?.map((msg, i) => (
          <li key={`${field}-${i}`}>
            <strong>{field}:</strong> {msg}
          </li>
        ))
      )}
    </ul>
  );
}
```

---

## Global Error Handler (Axios)

```typescript
import axios, { AxiosError } from "axios";

interface ApiError {
  success: false;
  code: string;
  message: string;
  errors: unknown | null;
}

function extractApiError(error: AxiosError): ApiError | null {
  if (error.response?.data && typeof error.response.data === "object") {
    return error.response.data as ApiError;
  }
  return null;
}

// Add global response interceptor
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const apiError = extractApiError(error);

    if (error.response?.status === 429) {
      const retryAfter = error.response.headers["retry-after"];
      console.warn(`Rate limited. Retry after: ${retryAfter}s`);
    }

    if (error.response?.status === 413) {
      console.error("File too large");
    }

    if (error.response?.status === 500) {
      console.error("Server error:", apiError?.message);
    }

    return Promise.reject(apiError ?? error);
  }
);
```

---

## Retry Recommendations

| Error | Should Retry? | Delay Strategy | Max Attempts |
|:---|:---|:---|:---|
| `429 Rate Limit` | ✅ Yes | Wait for `Retry-After` header | 3 |
| `500 Internal Error` | ✅ Yes | Exponential backoff (1s, 2s, 4s) | 3 |
| `503 AI Provider` | ✅ Yes | Exponential backoff (2s, 4s, 8s) | 5 |
| `400 Validation` | ❌ No | Fix the request | — |
| `400 File Type` | ❌ No | User must choose different file | — |
| `413 File Too Large` | ❌ No | User must reduce file size | — |
| `401 Unauthorized` | 🔄 Refresh | Attempt token refresh once | 1 |
| `403 Forbidden` | ❌ No | Show permission error | — |

### Retry with Exponential Backoff (TypeScript)

```typescript
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: { maxAttempts: number; initialDelayMs: number }
): Promise<T> {
  let attempt = 0;
  while (attempt < options.maxAttempts) {
    try {
      return await fn();
    } catch (error: unknown) {
      attempt++;
      if (attempt >= options.maxAttempts) throw error;
      const delay = options.initialDelayMs * Math.pow(2, attempt - 1);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw new Error("Retry limit reached");
}

// Usage
const result = await retryWithBackoff(
  () => api.post("/api/v1/importer/upload", form),
  { maxAttempts: 3, initialDelayMs: 1000 }
);
```
