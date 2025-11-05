# Setup Separasi Role - User vs Admin

Panduan lengkap untuk memastikan user dan admin login ke halaman yang berbeda.

## Konsep

- **User Dashboard** → Warna merah & kuning → Login di `/login`
- **Admin Dashboard** → Warna navy & putih → Login di `/admin/login`

### Penting!

User dari collection `users` **HANYA** bisa akses user dashboard.
Admin dari collection `admin_users` **HANYA** bisa akses admin dashboard.

## Step 1: Prepare Firebase Auth Accounts

Buat 2 akun terpisah di Firebase Console → Authentication:

### User Account
- Email: `user@example.com`
- Password: `password123`
- Copy UID yang muncul (misal: `USER_UID_12345`)

### Admin Account
- Email: `admin@example.com`
- Password: `admin123`
- Copy UID yang muncul (misal: `ADMIN_UID_67890`)

## Step 2: Setup Firestore Collections & Documents

### Collection: `users`

Buat collection `users` dengan document untuk setiap user biasa:

**Document ID:** `USER_UID_12345` (copy dari Firebase Auth)

**Fields:**
```
id: USER_UID_12345 (string)
email: user@example.com (string)
username: user123 (string)
full_name: John Doe (string)
phone: 08123456789 (string)
address: Jl. Contoh No. 123 (string)
points: 0 (number)
created_at: (timestamp) now
updated_at: (timestamp) now
```

### Collection: `admin_users`

Buat collection `admin_users` dengan document untuk setiap admin:

**Document ID:** `ADMIN_UID_67890` (copy dari Firebase Auth)

**Fields:**
```
id: ADMIN_UID_67890 (string)
email: admin@example.com (string)
username: administrator (string)
created_at: (timestamp) now
updated_at: (timestamp) now
```

## Step 3: Apply Firestore Security Rules

Buka Firebase Console → Firestore Database → Rules

**Replace dengan rules ini:**

```sql
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Users collection - hanya user sendiri yang bisa read/write
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
    }

    // Admin users collection - hanya admin sendiri yang bisa read/write
    match /admin_users/{adminId} {
      allow read, write: if request.auth.uid == adminId;
    }

    // Other collections - allow for now
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

Click **PUBLISH** untuk apply rules.

## Step 4: Test Flow

### Test User Login

1. Go to: `http://localhost:5173/login`
2. Login dengan user email: `user@example.com` / `password123`
3. **Hasil yang diharapkan:**
   - Header berubah (menampilkan poin, cart, profile icon, logout)
   - Bisa akses Create Pizza, Community, Contests
   - Bisa buka My Profile
   - Profile page menampilkan data user dari Firestore

4. **Jika gagal:**
   - Check error di browser console (F12)
   - Check apakah document user ada di Firestore collection `users`
   - Check apakah Security Rules sudah di-publish

### Test Admin Login

1. Go to: `http://localhost:5173/admin/login`
2. Login dengan admin email: `admin@example.com` / `admin123`
3. **Hasil yang diharapkan:**
   - Admin dashboard menampilkan (warna navy/putih)
   - Bisa akses admin pages (Dashboard, Orders, Inventory, Profile)

4. **Jika gagal:**
   - Check error di browser console
   - Check apakah document admin ada di Firestore collection `admin_users`
   - Pastikan email login cocok dengan field email di document

### Test Cross-Role Protection

1. **User mencoba akses admin:**
   - User email → login ke `/admin/login`
   - **Expected:** Error "Akun ini bukan admin"

2. **Admin mencoba akses user:**
   - Admin email → login ke `/login`
   - **Expected:** Error "Akun ini bukan user biasa. Silakan login melalui laman admin."

## Error Messages & Solutions

### User: "Akun ini bukan user biasa. Silakan login melalui laman admin."

**Penyebab:** Email login ada di Firestore collection `admin_users`, bukan `users`

**Solusi:**
- Pastikan pakai email yang ada di collection `users`
- Atau create document user baru

### Admin: "Akun ini bukan admin"

**Penyebab:** Email login ada di Firestore collection `users`, bukan `admin_users`

**Solusi:**
- Pastikan pakai email yang ada di collection `admin_users`
- Atau create document admin baru

### Login berhasil tapi tetap redirect ke login page

**Penyebab:**
- Security Rules belum di-publish
- Document user/admin belum dibuat di Firestore

**Solusi:**
1. Buka Firebase Console → Firestore → Rules
2. Pastikan rules sudah Published (bukan Draft)
3. Check console browser (F12) untuk melihat error detail
4. Verify document ada di Firestore dengan ID yang sesuai UID Firebase Auth

### "Permission denied" error di console

**Penyebab:** Security Rules salah atau belum published

**Solusi:**
1. Copy rules dari step 3 lagi
2. Make sure **PUBLISH** button di-click (bukan SAVE DRAFT)
3. Wait 1-2 minutes untuk rules to propagate
4. Refresh browser (Ctrl+F5)

## Troubleshooting Checklist

- [ ] User account dibuat di Firebase Auth
- [ ] Admin account dibuat di Firebase Auth
- [ ] Document user dibuat di Firestore `users` collection
- [ ] Document admin dibuat di Firestore `admin_users` collection
- [ ] Security Rules sudah di-PUBLISH (bukan draft)
- [ ] Document ID = UID dari Firebase Auth
- [ ] All required fields ada di documents
- [ ] Refresh page setelah setup (Ctrl+F5)
- [ ] Clear browser cache jika masih tidak bekerja

## Adding More Users/Admins

### Add New User

1. Firebase Console → Authentication → Create new user
2. Email & password
3. Copy UID yang muncul
4. Firestore → collection `users` → Add document
   - Document ID = UID
   - Add semua fields (id, email, username, full_name, phone, address, points, timestamps)

### Add New Admin

1. Firebase Console → Authentication → Create new user
2. Email & password
3. Copy UID yang muncul
4. Firestore → collection `admin_users` → Add document
   - Document ID = UID
   - Add fields (id, email, username, timestamps)

## Security Notes

- User hanya bisa read/write data mereka sendiri (by UID)
- Admin hanya bisa read/write data admin mereka sendiri (by UID)
- Collection `orders`, `products` dll bisa di-access oleh yang authenticated
- Tidak ada akses cross-role (user tidak bisa akses admin data dan sebaliknya)

## Next Steps

1. Setup kedua collections dengan benar
2. Test login sebagai user dan admin
3. Verify error messages sesuai expected
4. Clear browser cache jika ada issues
5. Check console untuk debugging

