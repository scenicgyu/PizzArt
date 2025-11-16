# Quick Start - Payment QRIS System

Panduan singkat untuk setup dan testing payment system.

## 1. Setup Midtrans (5 menit)

### Sandbox Testing
1. Daftar: https://dashboard.sandbox.midtrans.com/register
2. Login dan copy credentials:
   - Settings → Access Keys
   - Server Key: `SB-Mid-server-xxx`
   - Client Key: `SB-Mid-client-xxx`

### Set Webhook URL
1. Settings → Configuration
2. Payment Notification URL:
   ```
   https://qgdcgpplzlapjaqgnojw.supabase.co/functions/v1/midtrans-webhook
   ```
3. Save

## 2. Set Secrets di Supabase

Secrets sudah dikonfigurasi otomatis, tapi untuk update manual:

1. Buka Supabase Dashboard
2. Edge Functions → Secrets
3. Add/Update:
   ```
   MIDTRANS_SERVER_KEY = SB-Mid-server-xxx
   MIDTRANS_CLIENT_KEY = SB-Mid-client-xxx
   MIDTRANS_IS_PRODUCTION = false
   ```

## 3. Test Payment Flow

### A. User Flow (Frontend)

1. Login sebagai user
2. Tambah pizza ke cart
3. Klik "Checkout Sekarang"
4. QR Code akan muncul
5. Scan dengan e-wallet (sandbox)

### B. Test dengan Simulator

1. Buka: https://simulator.sandbox.midtrans.com/
2. Pilih "QR Code (QRIS)"
3. Input Order ID dari system
4. Simulate "Success Payment"
5. Dashboard admin akan update otomatis

### C. Manual Webhook Test

```bash
# Get your order ID first from cart checkout
# Then trigger webhook:

curl -X POST https://qgdcgpplzlapjaqgnojw.supabase.co/functions/v1/midtrans-webhook \
  -H "Content-Type: application/json" \
  -d '{
    "transaction_status": "settlement",
    "order_id": "ORDER-xxx-timestamp",
    "gross_amount": "100000",
    "payment_type": "qris",
    "transaction_time": "2025-01-20 10:00:00",
    "transaction_id": "test-123",
    "signature_key": "WILL_BE_VERIFIED",
    "status_code": "200"
  }'
```

## 4. Check Real-time Dashboard

1. Login sebagai admin: `/admin/login`
2. Go to Dashboard
3. Lihat section "Revenue Real-time"
4. Buat payment baru → Dashboard update otomatis
5. Tidak perlu refresh manual!

## 5. Debugging

### Check Payment Status
```bash
# Via Supabase SQL Editor
SELECT * FROM payments
ORDER BY created_at DESC
LIMIT 10;
```

### Check Webhook Logs
```bash
SELECT * FROM webhook_logs
ORDER BY created_at DESC
LIMIT 10;
```

### Check Revenue Stats
```bash
SELECT * FROM revenue_stats
ORDER BY date DESC;
```

## 6. Frontend Components

### QRISPayment Component
Location: `src/components/payment/QRISPayment.tsx`

Features:
- Generate QR dinamis
- Countdown timer
- Auto-polling status (5 detik)
- Success/failure handling
- Copy QR link

### RealtimeRevenue Component
Location: `src/components/admin/RealtimeRevenue.tsx`

Features:
- Real-time revenue cards
- WebSocket subscription
- 30-day trend chart
- Auto-refresh pada perubahan
- Manual refresh button

## 7. Edge Functions

### Deployed Functions
```
✓ create-qris-payment - Generate QR Code
✓ midtrans-webhook - Handle payment notification
✓ get-revenue-stats - Get revenue statistics
```

### Test Functions
```bash
# Test create payment
curl -X POST https://qgdcgpplzlapjaqgnojw.supabase.co/functions/v1/create-qris-payment \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"orderId":"test","amount":50000,"customerDetails":{"email":"test@test.com","name":"Test"}}'

# Test get stats
curl https://qgdcgpplzlapjaqgnojw.supabase.co/functions/v1/get-revenue-stats \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

## 8. Production Checklist

Sebelum production:
- [ ] Ganti ke Midtrans production credentials
- [ ] Set `MIDTRANS_IS_PRODUCTION=true`
- [ ] Update webhook URL di production Midtrans
- [ ] Test dengan payment real amount
- [ ] Enable monitoring/alerts
- [ ] Setup backup schedule
- [ ] Add error tracking (Sentry)

## 9. Common Issues

### QR tidak muncul
- Check Midtrans credentials di secrets
- Check browser console untuk errors
- Verify Edge Function logs

### Webhook tidak working
- Pastikan URL webhook benar di Midtrans
- Check webhook_logs table
- Test dengan Midtrans Simulator

### Dashboard tidak real-time
- Check browser WebSocket connection
- Verify Supabase Realtime enabled
- Check database trigger active

## 10. Support Links

- Midtrans Docs: https://docs.midtrans.com/
- Midtrans Sandbox: https://dashboard.sandbox.midtrans.com/
- Supabase Dashboard: https://supabase.com/dashboard
- Payment Setup Guide: `PAYMENT_SETUP_GUIDE.md`
- API Documentation: `API_DOCUMENTATION.md`

## Environment Variables

Current setup in `.env`:
```
VITE_SUPABASE_URL=https://qgdcgpplzlapjaqgnojw.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Midtrans secrets managed in Supabase Dashboard.

## One-Command Test

```bash
# Complete test flow
npm run dev

# Then:
# 1. Register/Login user
# 2. Add pizza to cart
# 3. Checkout
# 4. QR muncul
# 5. Simulate payment di Midtrans
# 6. Check dashboard real-time update
```

## Status Monitoring

Live status dapat dilihat di:
- User: Payment status di `/orders`
- Admin: Real-time dashboard di `/admin/dashboard`
- Database: Query langsung ke Supabase

Selesai! System siap digunakan.
