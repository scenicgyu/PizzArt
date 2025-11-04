# Troubleshooting Guide - PizzArt

## Masalah: Login berhasil tapi UI tidak update

**Gejala:**
- Setelah login, header tetap menampilkan tombol "Login"
- Tidak melihat poin, cart icon, atau profile icon
- Tidak bisa akses halaman Create Pizza, Community, Contests

**Penyebab:**
- Firestore Security Rules belum diterapkan atau salah konfigurasi
- User document belum ada di collection `users` di Firestore

**Solusi:**

### 1. Pastikan Security Rules Diterapkan

1. Buka Firebase Console → Firestore Database → Rules
2. Copy Security Rules dari `FIREBASE_SETUP.md`
3. Paste ke Rules editor
4. **PUBLISH** rules

### 2. Buat User Document di Firestore

Setelah login berhasil, buat document user manual:

1. Buka Firebase Console → Firestore Database
2. Buat collection `users` (jika belum ada)
3. Klik "Add document"
4. **Document ID**: Gunakan UID dari Firebase Auth
   - Cara mendapat UID: Login ke app → Buka Browser DevTools (F12) → Console
   - Ketik: `console.log(localStorage)` atau check di Firebase Console → Authentication

5. Add fields:
   ```
   id: (string) - copy UID
   email: (string) - email user
   username: (string) - nama user
   full_name: (string) - nama lengkap
   phone: (string) - nomor telepon (kosong boleh)
   address: (string) - alamat (kosong boleh)
   points: (number) - 0
   created_at: (timestamp) - sekarang
   updated_at: (timestamp) - sekarang
   ```

### 3. Verify di Browser Console

1. Buka halaman app
2. Buka DevTools (F12) → Console
3. Cek untuk error messages:
   - "Permission denied" → Security Rules problem
   - "User document does not exist" → Create document
   - Tidak ada error → Refresh page

Jika masih tidak bekerja:
- Refresh page (Ctrl+F5 atau Cmd+Shift+R)
- Clear browser cache dan local storage
- Logout dan login ulang

## Masalah: Protected Routes selalu redirect ke login

**Gejala:**
- Klik Create Pizza, Community, Contests → langsung ke login
- Padahal sudah login

**Penyebab:**
- Auth state belum fully loaded
- SessionStorage auth tidak tersimpan

**Solusi:**

1. Pastikan sudah login sampai header berubah
2. Refresh page setelah login
3. Tunggu ~2-3 detik sebelum akses protected routes
4. Cek di DevTools Console apakah ada error

## Masalah: Poin tidak muncul di header

**Gejala:**
- Header tidak menampilkan angka poin di sebelah trophy icon
- Profile page menampilkan poin 0

**Penyebab:**
- User document di Firestore tidak memiliki field `points`
- Firestore read permission denied

**Solusi:**

1. Buka User Document di Firestore
2. Tambahkan/ubah field `points` dengan value 0 atau angka lainnya
3. Refresh page

## Masalah: Tidak bisa update profil

**Gejala:**
- Di My Profile, ubah data → klik "Simpan Perubahan" → tidak ada perubahan

**Penyebab:**
- Firestore write permission denied
- Security Rules tidak mengizinkan update user sendiri

**Solusi:**

1. Cek Security Rules di Firebase Console → Firestore → Rules
2. Pastikan ada policy untuk UPDATE:
```sql
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
```

3. Publish rules dan retry

## Masalah: Profile Page tidak menampilkan data

**Gejala:**
- My Profile page blank atau loading terus

**Penyebab:**
- User data belum ter-load dari Firestore
- Profile page tidak mendapat user context

**Solusi:**

1. Pastikan sudah login
2. Tunggu loading selesai
3. Refresh page
4. Cek di DevTools Console untuk error messages

## Masalah: Admin login tidak bekerja

**Gejala:**
- Di `/admin/login`, input email & password → "Missing or insufficient permissions"

**Penyebab:**
- Firestore Security Rules belum diterapkan atau tidak allow admin_users read
- Document admin_users belum dibuat

**Solusi:**

1. **Apply Security Rules:**
   - Buka Firebase Console → Firestore → Rules
   - Pastikan ada policy untuk admin_users
   - Publish

2. **Buat Admin User:**
   - Di Firebase Console → Authentication → Create user
   - Email: admin@example.com, Password: xxxxx
   - Copy UID yang muncul

   - Di Firestore → Create collection `admin_users`
   - Document ID: paste UID
   - Fields:
     ```
     id: (string) - UID
     email: (string) - admin@example.com
     username: (string) - Admin
     created_at: (timestamp) - now
     updated_at: (timestamp) - now
     ```

3. Retry login

## Masalah: Database URL error

**Error:** "databaseURL property is invalid"

**Penyebab:**
- URL format salah di firebase.ts

**Solusi:**

Di `src/lib/firebase.ts`, check:
```javascript
// SALAH ❌
databaseURL: "https:pizzart-1.firebaseio.com",

// BENAR ✅
databaseURL: "https://pizzart-1.firebaseio.com",
```

Pastikan ada `//` setelah `https:`

## Checklist Setup Lengkap

Pastikan ini sudah done:

- [ ] Firebase project sudah dibuat (pizzart-1)
- [ ] Security Rules sudah diterapkan dan published
- [ ] Firestore collection `users` sudah dibuat
- [ ] Firestore collection `admin_users` sudah dibuat (jika ada admin)
- [ ] User document sudah ada di `users` collection
- [ ] Admin document sudah ada di `admin_users` collection (jika ada admin)
- [ ] Database URL fix di firebase.ts (https://)
- [ ] Test login → header should update
- [ ] Test access Create Pizza → should work without redirect

## Enable Console Debugging

Untuk debugging lebih detail:

1. Di Browser DevTools → Console
2. Ketik commands:
```javascript
// Check current auth user
firebase.auth().currentUser

// Check current user data
localStorage.getItem('firebaseLocalStorageDb')

// Check for errors
console.clear()
// kemudian refresh page dan lihat console
```

## Contact & Support

Jika masih ada masalah:
1. Check console error messages dengan detail
2. Verify semua Security Rules sudah applied
3. Verify semua documents di Firestore sudah dibuat dengan benar
4. Screenshot error message untuk reference

