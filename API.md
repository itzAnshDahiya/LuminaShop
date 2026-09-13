# LuminaShop API Documentation

## Base URL

```
http://localhost:3001
```

## Health Check

### GET /health

Healthcheck endpoint for monitoring service status.

**Response (200 OK)**
```json
{
  "status": "ok",
  "service": "LuminaShop Backend",
  "version": "1.0.0",
  "timestamp": "2026-09-13T12:00:00Z",
  "ollama": "http://localhost:11434",
  "database": "configured"
}
```

## Chat API

### POST /api/chat

Send a message to the multi-agent LangGraph. Returns agent response, products (if discovery), and updated cart.

**Request Headers**
```
Content-Type: application/json
```

**Request Body**
```json
{
  "message": "Find me wireless headphones",
  "sessionId": "optional-session-id"
}
```

**Parameters**
- `message` (string, required): User query or command
- `sessionId` (string, optional): Resume existing session (UUID format)

**Response (200 OK)**
```json
{
  "sessionId": "abc-123-def",
  "response": {
    "text": "I found 5 great wireless headphones for you!",
    "type": "products",
    "products": [
      {
        "id": "prod-001",
        "name": "Sony WH-1000XM5",
        "description": "Industry-leading noise canceling",
        "price": 349.99,
        "base_cost": 210.00,
        "category": "Electronics",
        "imageUrl": "https://...",
        "stock": 15,
        "similarity": 0.92
      }
    ]
  },
  "cart": [],
  "checkedOut": false
}
```

**Error Response (400 Bad Request)**
```json
{
  "error": "Message is required and must be a string"
}
```

**Error Response (400 Invalid Session)**
```json
{
  "error": "Invalid sessionId format"
}
```

**Error Response (429 Too Many Requests)**
```json
{
  "error": "Too many requests from this IP, please try again later."
}
```

**Error Response (500 Internal Server Error)**
```json
{
  "error": "An unexpected error occurred",
  "details": "error message here (development only)",
  "timestamp": "2026-09-13T12:00:00Z"
}
```

## Session API

### GET /api/session/:id

Retrieve full session state including messages and cart.

**Response (200 OK)**
```json
{
  "id": "abc-123-def",
  "messages": [
    {
      "role": "user",
      "content": "Find me headphones",
      "timestamp": "2026-09-13T12:00:00Z"
    },
    {
      "role": "assistant",
      "content": "I found some great options...",
      "timestamp": "2026-09-13T12:00:01Z"
    }
  ],
  "cart": [
    {
      "id": "prod-001",
      "name": "Sony WH-1000XM5",
      "price": 329.99,
      "quantity": 1
    }
  ],
  "checkedOut": false,
  "stripeUrl": null,
  "createdAt": "2026-09-13T12:00:00Z",
  "updatedAt": "2026-09-13T12:00:05Z"
}
```

### DELETE /api/session/:id

Clear session data (reset messages, cart, checkout state).

**Response (200 OK)**
```json
{
  "message": "Session cleared"
}
```

## Agent Response Types

### Discovery Response
```json
{
  "type": "products",
  "text": "I found 5 great options for you!",
  "products": [...]
}
```

### Negotiation Response
```json
{
  "type": "negotiation",
  "text": "Great! I've added Sony WH-1000XM5 at $329.99 to your cart.",
  "cart": [...],
  "cartTotal": 329.99
}
```

### Checkout Response
```json
{
  "type": "checkout",
  "text": "Your checkout is ready! Proceeding to payment...",
  "stripeUrl": "https://checkout.stripe.com/pay/...",
  "total": 329.99,
  "checkedOut": true
}
```

### General Conversation Response
```json
{
  "type": "message",
  "text": "That sounds interesting! Would you like me to find similar products?"
}
```

## Rate Limiting

All `/api/` endpoints are rate limited:

- **Default**: 30 requests per 60 seconds per IP
- **Configurable via**: `RATE_LIMIT_MAX_REQUESTS`, `RATE_LIMIT_WINDOW_MS`

When limit exceeded:
```
HTTP 429 Too Many Requests
X-RateLimit-Limit: 30
X-RateLimit-Current: 31
X-RateLimit-Reset: 1694592040
```

## Pagination

Not currently implemented. All product results limited to 5 items.

## Error Codes

| Code | Meaning |
|------|----------|
| 200 | Success |
| 400 | Bad Request (invalid input) |
| 404 | Not Found (session not found) |
| 429 | Too Many Requests (rate limited) |
| 500 | Internal Server Error |

## Examples

### cURL

```bash
# Send message
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Find me wireless headphones"
  }'

# Resume session
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Add to cart",
    "sessionId": "abc-123-def"
  }'

# Get session
curl http://localhost:3001/api/session/abc-123-def
```

### JavaScript/Fetch

```javascript
const response = await fetch('http://localhost:3001/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: 'Find me wireless headphones'
  })
});

const data = await response.json();
console.log(data.sessionId);
console.log(data.response.products);
```

---

**API Version**: 1.0.0
**Last Updated**: 2026-09-13
