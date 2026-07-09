# Webhooks Guide

> **Status**: Planned for v1.2. This document defines the webhook contract so frontend teams can design their backend receivers before the feature ships.

---

## Overview

Webhooks allow your server to receive push notifications when import events occur, without polling. The AI CSV Importer will POST a signed JSON payload to your configured URL when specified events fire.

---

## Webhook Registration (Planned)

```
POST /api/v1/webhooks
```

```json
{
  "url": "https://your-server.com/webhooks/import",
  "events": ["import:completed", "import:failed"],
  "secret": "your-signing-secret"
}
```

---

## Webhook Payload Structure

```typescript
interface WebhookPayload {
  id: string;                // Unique webhook delivery ID
  event: string;             // Event name e.g. "import:completed"
  importId: string;
  timestamp: string;         // ISO 8601
  data: unknown;             // Event-specific payload
}
```

### Example: import:completed

```json
{
  "id": "wh_550e8400",
  "event": "import:completed",
  "importId": "abc-123",
  "timestamp": "2026-07-10T01:00:00.000Z",
  "data": {
    "totalRows": 1000,
    "successfulRows": 982,
    "durationMs": 4500,
    "cost": { "totalCost": 0.0275, "currency": "USD" }
  }
}
```

---

## Signature Verification

Every webhook POST will include a signature header:

```
X-Signature-256: sha256=<HMAC-SHA256 of raw body using your secret>
```

### Verifying in Node.js

```typescript
import crypto from "crypto";

function verifyWebhookSignature(
  rawBody: string,
  signature: string,
  secret: string
): boolean {
  const expected = `sha256=${crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex")}`;

  return crypto.timingSafeEqual(
    Buffer.from(expected),
    Buffer.from(signature)
  );
}
```

---

## Retry Policy

Failed webhook deliveries (non-2xx response or timeout) will be retried:

| Attempt | Delay |
|:---|:---|
| 1st retry | 1 minute |
| 2nd retry | 5 minutes |
| 3rd retry | 30 minutes |
| 4th retry | 2 hours |
| Final | 24 hours |

After 5 failed attempts, the delivery is marked **abandoned**.

---

## Events Available for Webhooks

| Event | Description |
|:---|:---|
| `import:completed` | Import finished successfully |
| `import:failed` | Import failed with error |
| `import:cancelled` | Import was cancelled |
| `metrics:cost_threshold:exceeded` | Cost exceeded configured limit |

---

## Webhook Best Practices

1. **Respond quickly** — Return `200 OK` within 5 seconds. Do heavy processing asynchronously.
2. **Verify the signature** — Always verify `X-Signature-256` before trusting the payload.
3. **Handle duplicates** — Store the webhook `id` and deduplicate retried deliveries.
4. **Return 200** — Even if you don't handle an event type, return `200 OK` to prevent unnecessary retries.
