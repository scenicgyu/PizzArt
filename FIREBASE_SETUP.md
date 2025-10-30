# Firebase Setup Guide

Panduan lengkap setup Firebase untuk aplikasi PizzArt.

## 1. Firestore Security Rules

**PENTING**: Copy dan paste Security Rules berikut ke Firebase Console → Firestore Database → Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Helper function untuk cek apakah user adalah admin
    function isAdmin() {
      return exists(/databases/$(database)/documents/admin_users/$(request.auth.uid));
    }

    // Users collection - Regular users
    match /users/{userId} {
      // User bisa read dan update data mereka sendiri
      allow read: if request.auth != null && request.auth.uid == userId;
      allow create: if request.auth != null && request.auth.uid == userId;
      allow update: if request.auth != null && request.auth.uid == userId;
      allow delete: if false;

      // Admin bisa read semua users
      allow read: if request.auth != null && isAdmin();
    }

    // Admin users collection
    match /admin_users/{adminId} {
      // Admin bisa read data mereka sendiri
      allow read: if request.auth != null && request.auth.uid == adminId;
      // Hanya bisa dibuat manual melalui Firebase Console
      allow write: if false;
    }

    // Inventory collection
    match /inventory/{inventoryId} {
      // Semua authenticated user bisa read inventory
      allow read: if request.auth != null;
      // Hanya admin yang bisa write
      allow write: if request.auth != null && isAdmin();
    }

    // Orders collection
    match /orders/{orderId} {
      // User bisa read order mereka sendiri
      allow read: if request.auth != null &&
                    (resource.data.user_id == request.auth.uid || isAdmin());
      // User bisa create order untuk diri sendiri
      allow create: if request.auth != null &&
                      request.resource.data.user_id == request.auth.uid;
      // Hanya admin yang bisa update order
      allow update: if request.auth != null && isAdmin();
      allow delete: if false;
    }

    // Order items collection
    match /order_items/{itemId} {
      // User bisa read order items dari order mereka sendiri
      allow read: if request.auth != null;
      // User bisa create order items
      allow create: if request.auth != null;
      // Admin bisa read semua
      allow read: if request.auth != null && isAdmin();
      allow update: if false;
      allow delete: if false;
    }

    // Community pizzas collection (optional)
    match /community_pizzas/{pizzaId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth != null &&
                      (resource.data.created_by == request.auth.uid || isAdmin());
      allow delete: if request.auth != null &&
                      (resource.data.created_by == request.auth.uid || isAdmin());
    }

    // Contests collection (optional)
    match /contests/{contestId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && isAdmin();
    }

    // Contest submissions collection (optional)
    match /contest_submissions/{submissionId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth != null && isAdmin();
      allow delete: if false;
    }
  }
}
```

## 2. Setup Admin User

### Cara 1: Melalui Firebase Console

1. Buka Firebase Console → Authentication
2. Klik "Add user"
3. Masukkan:
   - Email: `beomgyu@gmail.com` (atau email admin Anda)
   - Password: Buat password yang kuat
4. Klik "Add user"
5. Copy UID user yang baru dibuat

6. Buka Firestore Database
7. Buka collection `admin_users`
8. Klik "Add document"
9. Document ID: **Paste UID yang di-copy tadi**
10. Add fields:
    - `id` (string): Paste UID lagi
    - `email` (string): `beomgyu@gmail.com`
    - `username` (string): `Admin`
    - `created_at` (timestamp): Klik "Insert timestamp"
    - `updated_at` (timestamp): Klik "Insert timestamp"
11. Klik "Save"

### Cara 2: Melalui Firebase Admin SDK (Advanced)

```javascript
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const auth = admin.auth();
const db = admin.firestore();

async function createAdmin(email, password, username) {
  try {
    // Create auth user
    const userRecord = await auth.createUser({
      email: email,
      password: password,
      emailVerified: true
    });

    // Add to admin_users collection
    await db.collection('admin_users').doc(userRecord.uid).set({
      id: userRecord.uid,
      email: email,
      username: username,
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log('Admin user created successfully:', userRecord.uid);
  } catch (error) {
    console.error('Error creating admin:', error);
  }
}

// Usage
createAdmin('beomgyu@gmail.com', 'your-secure-password', 'Admin');
```

## 3. Import Inventory Data

1. Buka Firestore Database
2. Buat collection `inventory` (jika belum ada)
3. Import data dari `firestore-data/inventory.json`

### Manual Import:
Untuk setiap item di `inventory.json`, klik "Add document" dan masukkan data

### Script Import (Recommended):
```javascript
const admin = require('firebase-admin');
const inventoryData = require('./firestore-data/inventory.json');

const db = admin.firestore();

async function importInventory() {
  const batch = db.batch();

  inventoryData.forEach(item => {
    const docRef = db.collection('inventory').doc();
    batch.set(docRef, {
      ...item,
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    });
  });

  await batch.commit();
  console.log('Inventory imported successfully');
}

importInventory();
```

## 4. Testing

### Test Admin Login:
1. Buka `/admin/login`
2. Login dengan email dan password admin yang sudah dibuat
3. Jika berhasil, akan redirect ke `/admin/dashboard`

### Test User Registration:
1. Buka `/register`
2. Register akun baru
3. Login dengan akun tersebut
4. Header harus menampilkan poin (default: 0)
5. Klik icon profile untuk ke halaman My Profile

### Test User Profile:
1. Login sebagai user
2. Klik icon profile (user icon) di header
3. Harus redirect ke `/my-profile`
4. Harus menampilkan:
   - Username dan email
   - Poin loyalty
   - Riwayat pesanan (jika ada)

## 5. Troubleshooting

### "Missing or insufficient permissions"
- **Penyebab**: Security Rules belum diterapkan atau salah konfigurasi
- **Solusi**:
  1. Copy Security Rules dari bagian 1
  2. Paste ke Firebase Console → Firestore → Rules
  3. Klik "Publish"

### Admin tidak bisa login
- **Penyebab**: Document admin_users belum dibuat atau UID tidak cocok
- **Solusi**:
  1. Pastikan document ID di `admin_users` sama dengan UID user di Authentication
  2. Pastikan field `id` di document juga sama dengan UID

### User profile tidak muncul
- **Penyebab**: User belum login atau data belum ter-load
- **Solusi**:
  1. Logout dan login ulang
  2. Check browser console untuk error
  3. Pastikan Security Rules mengizinkan user read data mereka sendiri

### Poin tidak muncul
- **Penyebab**: Document user belum dibuat di Firestore
- **Solusi**:
  1. Logout dan login ulang (akan auto-create document)
  2. Atau register akun baru

## 6. Environment Variables

Pastikan file `.env` sudah berisi:

```
VITE_FIREBASE_API_KEY=AIzaSyCCfwMekxBh4Kd3-4F8aaLl3SQ1CQY_dKc
VITE_FIREBASE_AUTH_DOMAIN=pizzart-1.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://pizzart-1.firebaseio.com
VITE_FIREBASE_PROJECT_ID=pizzart-1
VITE_FIREBASE_STORAGE_BUCKET=pizzart-1.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=168059122581
VITE_FIREBASE_APP_ID=1:168059122581:web:07a6a80fc43d22a1267c9c
VITE_FIREBASE_MEASUREMENT_ID=G-6QJGJMKT0Y
```

## 7. Next Steps

1. ✅ Apply Security Rules
2. ✅ Create admin user
3. ✅ Import inventory data
4. ✅ Test admin login
5. ✅ Test user registration
6. ✅ Test user profile
7. ✅ Create first order

Setelah semua langkah selesai, aplikasi sudah siap digunakan!
