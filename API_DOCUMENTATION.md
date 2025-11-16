# API Documentation - Payment System

## Base URLs

```
Supabase: https://qgdcgpplzlapjaqgnojw.supabase.co
Edge Functions: https://qgdcgpplzlapjaqgnojw.supabase.co/functions/v1
```

## Authentication

All endpoints (except webhook) require Bearer token:

```
Authorization: Bearer {SUPABASE_ANON_KEY}
```

---

## 1. Create QRIS Payment

Generate QR Code untuk pembayaran.

**Endpoint:** `POST /functions/v1/create-qris-payment`

**Headers:**
```
Authorization: Bearer {SUPABASE_ANON_KEY}
Content-Type: application/json
```

**Request Body:**
```json
{
  "orderId": "order123",
  "amount": 100000,
  "customerDetails": {
    "email": "customer@example.com",
    "name": "John Doe"
  }
}
```

**Success Response (200):**
```json
{
  "success": true,
  "payment": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "qr_string": "https://api.sandbox.midtrans.com/v2/qris/...",
    "transaction_id": "abc123",
    "midtrans_order_id": "ORDER-order123-1234567890",
    "expiry_time": "2025-01-20T10:30:00Z",
    "amount": 100000
  }
}
```

**Error Response (500):**
```json
{
  "success": false,
  "error": "Failed to create QRIS payment"
}
```

**Example cURL:**
```bash
curl -X POST https://qgdcgpplzlapjaqgnojw.supabase.co/functions/v1/create-qris-payment \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "test123",
    "amount": 50000,
    "customerDetails": {
      "email": "test@example.com",
      "name": "Test User"
    }
  }'
```

---

## 2. Midtrans Webhook

Menerima notifikasi dari Midtrans saat status pembayaran berubah.

**Endpoint:** `POST /functions/v1/midtrans-webhook`

**Headers:**
```
Content-Type: application/json
```

**Request Body (dari Midtrans):**
```json
{
  "transaction_status": "settlement",
  "order_id": "ORDER-order123-1234567890",
  "gross_amount": "100000",
  "payment_type": "qris",
  "transaction_time": "2025-01-20 10:00:00",
  "transaction_id": "abc123",
  "signature_key": "hash_signature",
  "status_code": "200",
  "fraud_status": "accept"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "status": "success"
}
```

**Signature Verification:**
Webhook memverifikasi signature dengan formula:
```
SHA512(order_id + status_code + gross_amount + server_key)
```

**Transaction Status Mapping:**

| Midtrans Status | App Status | Description |
|----------------|------------|-------------|
| `capture` | `success` | Payment captured (credit card) |
| `settlement` | `success` | Payment settled |
| `pending` | `pending` | Waiting for payment |
| `deny` | `failed` | Payment denied |
| `cancel` | `failed` | Payment cancelled |
| `expire` | `failed` | Payment expired |

**Setup di Midtrans:**
1. Login ke Midtrans Dashboard
2. Settings → Configuration
3. Payment Notification URL: `https://qgdcgpplzlapjaqgnojw.supabase.co/functions/v1/midtrans-webhook`
4. Save

---

## 3. Get Revenue Statistics

Mendapatkan statistik revenue real-time.

**Endpoint:** `GET /functions/v1/get-revenue-stats`

**Headers:**
```
Authorization: Bearer {SUPABASE_ANON_KEY}
```

**Success Response (200):**
```json
{
  "success": true,
  "stats": {
    "total_revenue": 5000000,
    "total_orders": 50,
    "total_payments": 45,
    "today": {
      "total_revenue": 500000,
      "total_orders": 5,
      "successful_payments": 4
    },
    "recent": [
      {
        "date": "2025-01-20",
        "total_revenue": 500000,
        "total_orders": 5,
        "successful_payments": 4
      },
      {
        "date": "2025-01-19",
        "total_revenue": 750000,
        "total_orders": 8,
        "successful_payments": 7
      }
    ],
    "pending_payments": 5
  }
}
```

**Example cURL:**
```bash
curl -X GET https://qgdcgpplzlapjaqgnojw.supabase.co/functions/v1/get-revenue-stats \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

---

## 4. Check Payment Status

Check status pembayaran via Supabase REST API.

**Endpoint:** `GET /rest/v1/payments?midtrans_order_id=eq.{order_id}&select=status`

**Headers:**
```
apikey: {SUPABASE_ANON_KEY}
Authorization: Bearer {SUPABASE_ANON_KEY}
```

**Success Response (200):**
```json
[
  {
    "status": "success"
  }
]
```

**Example cURL:**
```bash
curl -X GET "https://qgdcgpplzlapjaqgnojw.supabase.co/rest/v1/payments?midtrans_order_id=eq.ORDER-test-123&select=status" \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

---

## Database Schema

### payments Table

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| order_id | text | Firebase order ID |
| user_id | text | User ID |
| amount | numeric | Payment amount |
| payment_method | text | Payment method (qris) |
| status | text | pending/success/failed/expired |
| qr_string | text | QR Code URL |
| transaction_id | text | Midtrans transaction ID |
| midtrans_order_id | text | Unique order ID for Midtrans |
| expiry_time | timestamptz | QR expiry time |
| paid_at | timestamptz | Payment success timestamp |
| metadata | jsonb | Additional data |
| created_at | timestamptz | Created timestamp |
| updated_at | timestamptz | Updated timestamp |

### revenue_stats Table

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| date | date | Date (unique) |
| total_revenue | numeric | Total revenue for the day |
| total_orders | integer | Number of orders |
| successful_payments | integer | Number of successful payments |
| created_at | timestamptz | Created timestamp |
| updated_at | timestamptz | Updated timestamp |

---

## Real-time Subscriptions

Subscribe to database changes via Supabase Realtime:

```typescript
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Subscribe to payment changes
supabase
  .channel('payment-updates')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'payments'
  }, (payload) => {
    console.log('Payment changed:', payload);
  })
  .subscribe();

// Subscribe to revenue stats changes
supabase
  .channel('revenue-updates')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'revenue_stats'
  }, (payload) => {
    console.log('Revenue changed:', payload);
  })
  .subscribe();
```

---

## Error Codes

| Status Code | Description |
|-------------|-------------|
| 200 | Success |
| 401 | Unauthorized - Invalid or missing token |
| 404 | Not found - Payment or resource not found |
| 500 | Internal server error |

---

## Rate Limits

Current implementation does not have rate limiting. Recommended limits:

- Create Payment: 10 requests/minute per user
- Get Revenue Stats: 60 requests/minute
- Webhook: Unlimited (from Midtrans only)

---

## Security Notes

1. Webhook signature is verified using SHA512
2. RLS policies enforce user-level access
3. Server keys are never exposed to client
4. All sensitive operations use service role key
5. Webhook logs stored for audit trail

---

## Testing

### Sandbox Mode

Use Midtrans Sandbox credentials:
```
Server Key: SB-Mid-server-xxx
Client Key: SB-Mid-client-xxx
```

Test cards and e-wallets available at:
https://docs.midtrans.com/docs/testing-payment-on-sandbox

### Manual Webhook Test

```bash
curl -X POST https://qgdcgpplzlapjaqgnojw.supabase.co/functions/v1/midtrans-webhook \
  -H "Content-Type: application/json" \
  -d '{
    "transaction_status": "settlement",
    "order_id": "YOUR_ORDER_ID",
    "gross_amount": "100000",
    "payment_type": "qris",
    "transaction_time": "2025-01-20 10:00:00",
    "transaction_id": "test123",
    "signature_key": "CALCULATED_SIGNATURE",
    "status_code": "200"
  }'
```
