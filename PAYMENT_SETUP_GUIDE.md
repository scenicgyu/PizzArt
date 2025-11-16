# Payment QRIS Setup Guide - PizzArt

Panduan lengkap untuk setup pembayaran QRIS menggunakan Midtrans API dengan real-time revenue tracking.

## Arsitektur Sistem

```
User Checkout → Create Order (Firebase) → Generate QRIS (Supabase Edge Function)
                                                    ↓
                                          Midtrans API (Generate QR)
                                                    ↓
                                          Store Payment (Supabase)
                                                    ↓
User Scan QR → Payment Success → Midtrans Webhook → Update Payment Status
                                                    ↓
                                          Trigger Update Revenue Stats
                                                    ↓
                                          Real-time Update (WebSocket)
```

## 1. Setup Midtrans Account

### Sandbox (Testing)
1. Daftar di https://dashboard.sandbox.midtrans.com/register
2. Login dan buka Settings → Access Keys
3. Copy **Server Key** dan **Client Key**

### Production
1. Daftar di https://dashboard.midtrans.com/register
2. Lengkapi verifikasi bisnis
3. Copy **Server Key** dan **Client Key** production

## 2. Setup Supabase Secrets

Secrets sudah dikonfigurasi otomatis, tapi untuk referensi:

```bash
# Set via Supabase Dashboard → Edge Functions → Secrets
MIDTRANS_SERVER_KEY=SB-Mid-server-xxx (sandbox) atau Mid-server-xxx (production)
MIDTRANS_CLIENT_KEY=SB-Mid-client-xxx (sandbox) atau Mid-client-xxx (production)
MIDTRANS_IS_PRODUCTION=false (sandbox) atau true (production)
```

## 3. Database Tables

Tabel sudah dibuat via migration, struktur:

### payments
- `id` - UUID primary key
- `order_id` - Reference ke Firebase orders
- `user_id` - User ID yang melakukan pembayaran
- `amount` - Jumlah pembayaran
- `payment_method` - 'qris'
- `status` - 'pending', 'success', 'failed', 'expired'
- `qr_string` - URL QR Code dari Midtrans
- `transaction_id` - Midtrans transaction ID
- `midtrans_order_id` - Unique order ID untuk Midtrans
- `expiry_time` - Waktu kedaluwarsa QR
- `paid_at` - Timestamp pembayaran sukses

### revenue_stats
- `id` - UUID primary key
- `date` - Tanggal (unique)
- `total_revenue` - Total pendapatan hari itu
- `total_orders` - Jumlah order
- `successful_payments` - Jumlah pembayaran sukses

### webhook_logs
- Logging webhook untuk debugging

## 4. Edge Functions

### A. create-qris-payment

**Endpoint:** `{SUPABASE_URL}/functions/v1/create-qris-payment`

**Method:** POST

**Headers:**
```
Authorization: Bearer {SUPABASE_ANON_KEY}
Content-Type: application/json
```

**Request Body:**
```json
{
  "orderId": "firebase_order_id",
  "amount": 100000,
  "customerDetails": {
    "email": "customer@email.com",
    "name": "Customer Name"
  }
}
```

**Response:**
```json
{
  "success": true,
  "payment": {
    "id": "uuid",
    "qr_string": "https://api.sandbox.midtrans.com/v2/qris/...",
    "transaction_id": "...",
    "midtrans_order_id": "ORDER-xxx-timestamp",
    "expiry_time": "2025-01-20T10:30:00Z",
    "amount": 100000
  }
}
```

### B. midtrans-webhook

**Endpoint:** `{SUPABASE_URL}/functions/v1/midtrans-webhook`

**Method:** POST (dari Midtrans)

**Setup di Midtrans Dashboard:**
1. Login ke Midtrans Dashboard
2. Settings → Configuration → Payment Notification URL
3. Masukkan: `{SUPABASE_URL}/functions/v1/midtrans-webhook`
4. Save

**Webhook akan otomatis:**
- Verifikasi signature dari Midtrans
- Update status payment di database
- Trigger update revenue_stats via database trigger
- Log semua notifikasi untuk debugging

### C. get-revenue-stats

**Endpoint:** `{SUPABASE_URL}/functions/v1/get-revenue-stats`

**Method:** GET

**Headers:**
```
Authorization: Bearer {SUPABASE_ANON_KEY}
```

**Response:**
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
      }
    ],
    "pending_payments": 5
  }
}
```

## 5. Frontend Integration

### A. Payment Flow

```typescript
// 1. User klik checkout di CartPage
handleCheckout() → Create Firebase Order → Show QRIS Modal

// 2. QRISPayment Component
- Call create-qris-payment Edge Function
- Display QR Code
- Poll payment status setiap 5 detik
- Auto-redirect setelah pembayaran sukses

// 3. Payment Status Polling
Check Supabase payments table status
If status = 'success' → onSuccess()
If status = 'failed' atau 'expired' → Show error
```

### B. Real-time Revenue Dashboard

```typescript
// RealtimeRevenue Component
- Subscribe ke Supabase Realtime
- Listen perubahan di table 'payments' dan 'revenue_stats'
- Auto-refresh saat ada perubahan
- Display revenue cards dan chart
```

## 6. Testing Payment Flow

### Test di Sandbox Mode

1. **Setup Environment:**
```
MIDTRANS_IS_PRODUCTION=false
MIDTRANS_SERVER_KEY=SB-Mid-server-xxx
```

2. **Test Payment:**
   - Login sebagai user
   - Tambah pizza ke cart
   - Klik checkout
   - QR Code akan muncul
   - Scan dengan Gopay/OVO/Dana sandbox app

3. **Atau Test Manual:**
   - Call webhook manual dari Midtrans Simulator
   - https://simulator.sandbox.midtrans.com/

4. **Test Webhook:**
```bash
curl -X POST {SUPABASE_URL}/functions/v1/midtrans-webhook \
  -H "Content-Type: application/json" \
  -d '{
    "transaction_status": "settlement",
    "order_id": "ORDER-xxx",
    "gross_amount": "100000",
    "payment_type": "qris",
    "transaction_time": "2025-01-20 10:00:00",
    "transaction_id": "test-123",
    "signature_key": "...",
    "status_code": "200"
  }'
```

## 7. Real-time Features

### Supabase Realtime Setup

Dashboard admin otomatis subscribe ke perubahan:

```typescript
supabase
  .channel('revenue-changes')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'payments'
  }, handleChange)
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'revenue_stats'
  }, handleChange)
  .subscribe()
```

**Kapan Update Terjadi:**
- Payment baru dibuat → Real-time update pending count
- Payment status berubah → Real-time update stats
- Revenue stats diupdate (via trigger) → Dashboard refresh otomatis

## 8. Security Best Practices

### Implemented:
1. Webhook signature verification
2. RLS policies di Supabase
3. JWT verification di Edge Functions
4. Server key tidak exposed ke client
5. Payment amount validation

### Additional Recommendations:
1. Rate limiting di Edge Functions
2. IP whitelist untuk webhook (Midtrans IPs)
3. Monitoring suspicious transactions
4. Fraud detection integration

## 9. Monitoring & Debugging

### Webhook Logs
```sql
SELECT * FROM webhook_logs
ORDER BY created_at DESC
LIMIT 50;
```

### Failed Payments
```sql
SELECT * FROM payments
WHERE status = 'failed'
ORDER BY created_at DESC;
```

### Revenue by Date
```sql
SELECT
  date,
  total_revenue,
  total_orders,
  successful_payments
FROM revenue_stats
ORDER BY date DESC
LIMIT 30;
```

## 10. Production Checklist

- [ ] Ganti Midtrans ke production credentials
- [ ] Set MIDTRANS_IS_PRODUCTION=true
- [ ] Update webhook URL di Midtrans Dashboard
- [ ] Test payment flow dengan uang real
- [ ] Setup monitoring alerts
- [ ] Backup database schedule
- [ ] Setup error reporting (Sentry)
- [ ] Load test Edge Functions

## 11. Troubleshooting

### QR Code tidak muncul
- Check Midtrans credentials
- Check Supabase Edge Function logs
- Verify network connection
- Check browser console errors

### Webhook tidak working
- Verify webhook URL di Midtrans
- Check signature verification
- Review webhook_logs table
- Test with Midtrans Simulator

### Revenue tidak update real-time
- Check Supabase Realtime connection
- Verify database trigger active
- Check browser WebSocket connection

### Payment stuck di pending
- Check Midtrans transaction status
- Manually trigger webhook
- Check payment expiry time

## 12. API Endpoints Summary

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/functions/v1/create-qris-payment` | POST | Required | Generate QR Code |
| `/functions/v1/midtrans-webhook` | POST | Public | Handle payment notification |
| `/functions/v1/get-revenue-stats` | GET | Required | Get revenue statistics |

## Support

Jika ada masalah:
1. Check webhook_logs table
2. Review Edge Function logs di Supabase Dashboard
3. Test dengan Midtrans Simulator
4. Contact Midtrans support untuk payment issues
