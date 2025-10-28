# Firestore Database Structure

Dokumen ini menjelaskan struktur database Firestore untuk aplikasi PizzArt.

## Collections

### 1. users
Collection untuk menyimpan data profil pengguna regular/customer.

**Document ID**: User UID dari Firebase Auth

**Fields**:
- `id` (string) - User UID, sama dengan document ID
- `email` (string) - Email pengguna
- `username` (string) - Username untuk display
- `full_name` (string) - Nama lengkap pengguna
- `phone` (string) - Nomor telepon
- `address` (string) - Alamat pengiriman
- `points` (number) - Poin loyalitas/gamifikasi
- `created_at` (timestamp/string) - Waktu pembuatan akun
- `updated_at` (timestamp/string) - Waktu update terakhir

**Indexes yang disarankan**:
- `email` (ascending)
- `username` (ascending)

---

### 2. admin_users
Collection untuk menyimpan data admin.

**Document ID**: User UID dari Firebase Auth

**Fields**:
- `id` (string) - Admin UID, sama dengan document ID
- `email` (string) - Email admin
- `username` (string) - Username admin
- `created_at` (timestamp/string) - Waktu pembuatan akun admin
- `updated_at` (timestamp/string) - Waktu update terakhir

**Catatan**: Admin login menggunakan email yang memiliki domain khusus atau terdaftar di collection ini.

---

### 3. inventory
Collection untuk menyimpan data stok bahan-bahan pizza.

**Document ID**: Auto-generated

**Fields**:
- `id` (string) - ID inventory, sama dengan document ID
- `name` (string) - Nama bahan (contoh: "Mozzarella Cheese")
- `category` (string) - Kategori: "meat", "vegetable", "cheese", "sauce", "base"
- `stock_quantity` (number) - Jumlah stok saat ini
- `unit` (string) - Satuan: "kg", "pieces", "liters"
- `is_available` (boolean) - Status ketersediaan (toggle admin)
- `low_stock_threshold` (number) - Batas minimum stok untuk warning
- `created_at` (timestamp/string) - Waktu pembuatan item
- `updated_at` (timestamp/string) - Waktu update terakhir

**Indexes yang disarankan**:
- `category` (ascending)
- `is_available` (ascending)
- `name` (ascending)

---

### 4. orders
Collection untuk menyimpan data pesanan.

**Document ID**: Auto-generated

**Fields**:
- `id` (string) - Order ID, sama dengan document ID
- `user_id` (string) - Reference ke user UID
- `user_email` (string) - Email customer
- `user_name` (string) - Nama customer
- `total_price` (number) - Total harga pesanan
- `status` (string) - Status: "pending", "processing", "completed", "shipped"
- `created_at` (timestamp/string) - Waktu pembuatan pesanan
- `updated_at` (timestamp/string) - Waktu update status terakhir

**Indexes yang disarankan**:
- `user_id` (ascending)
- `status` (ascending)
- `created_at` (descending)

**Security Rules**:
- User hanya bisa membaca pesanan mereka sendiri
- Admin bisa membaca dan update semua pesanan

---

### 5. order_items
Collection untuk menyimpan detail item dalam pesanan.

**Document ID**: Auto-generated

**Fields**:
- `id` (string) - Order item ID, sama dengan document ID
- `order_id` (string) - Reference ke orders document ID
- `pizza_name` (string) - Nama custom pizza
- `size` (string) - Ukuran pizza: "small", "medium", "large"
- `crust` (string) - Jenis crust: "thin", "thick", "stuffed"
- `sauce` (string) - Jenis sauce: "tomato", "bbq", "white", "pesto", "spicy"
- `toppings` (array) - Array of objects, contoh: `[{name: "Pepperoni", category: "meat"}, ...]`
- `quantity` (number) - Jumlah pizza
- `price` (number) - Harga per item
- `created_at` (timestamp/string) - Waktu pembuatan item

**Indexes yang disarankan**:
- `order_id` (ascending)

**Security Rules**:
- User hanya bisa membaca order_items dari pesanan mereka sendiri
- Admin bisa membaca semua order_items

---

### 6. community_pizzas (Optional - untuk fitur community)
Collection untuk menyimpan pizza buatan user yang di-share ke komunitas.

**Document ID**: Auto-generated

**Fields**:
- `id` (string) - Pizza ID, sama dengan document ID
- `name` (string) - Nama custom pizza
- `size` (string) - Ukuran pizza
- `crust` (string) - Jenis crust
- `sauce` (string) - Jenis sauce
- `toppings` (array) - Array of topping objects
- `price` (number) - Estimasi harga
- `created_by` (string) - User ID pembuat
- `created_by_username` (string) - Username pembuat
- `likes` (number) - Jumlah likes
- `created_at` (timestamp/string) - Waktu pembuatan

**Indexes yang disarankan**:
- `created_by` (ascending)
- `likes` (descending)
- `created_at` (descending)

---

### 7. contests (Optional - untuk fitur contest)
Collection untuk menyimpan data lomba pizza.

**Document ID**: Auto-generated

**Fields**:
- `id` (string) - Contest ID, sama dengan document ID
- `title` (string) - Judul lomba
- `description` (string) - Deskripsi lomba
- `theme` (string) - Tema lomba
- `prize` (string) - Hadiah
- `start_date` (timestamp/string) - Tanggal mulai
- `end_date` (timestamp/string) - Tanggal berakhir
- `status` (string) - Status: "active", "ended"
- `created_at` (timestamp/string) - Waktu pembuatan

---

### 8. contest_submissions (Optional - untuk fitur contest)
Collection untuk menyimpan submission ke contest.

**Document ID**: Auto-generated

**Fields**:
- `id` (string) - Submission ID, sama dengan document ID
- `contest_id` (string) - Reference ke contests document ID
- `user_id` (string) - User ID pembuat
- `user_name` (string) - Nama pembuat
- `pizza_name` (string) - Nama pizza
- `pizza_data` (object) - Data lengkap pizza (size, crust, sauce, toppings)
- `votes` (number) - Jumlah vote
- `created_at` (timestamp/string) - Waktu submission

**Indexes yang disarankan**:
- `contest_id` (ascending)
- `votes` (descending)
- `user_id` (ascending)

---

## Security Rules

Berikut adalah contoh Firestore Security Rules yang disarankan:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Helper function untuk cek apakah user adalah admin
    function isAdmin() {
      return exists(/databases/$(database)/documents/admin_users/$(request.auth.uid));
    }

    // Users collection
    match /users/{userId} {
      allow read: if request.auth != null && (request.auth.uid == userId || isAdmin());
      allow create: if request.auth != null && request.auth.uid == userId;
      allow update: if request.auth != null && request.auth.uid == userId;
      allow delete: if false;
    }

    // Admin users collection
    match /admin_users/{adminId} {
      allow read: if request.auth != null && request.auth.uid == adminId;
      allow write: if false; // Admin dibuat manual melalui Firebase Console
    }

    // Inventory collection
    match /inventory/{inventoryId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && isAdmin();
    }

    // Orders collection
    match /orders/{orderId} {
      allow read: if request.auth != null &&
                    (resource.data.user_id == request.auth.uid || isAdmin());
      allow create: if request.auth != null &&
                      request.resource.data.user_id == request.auth.uid;
      allow update: if request.auth != null && isAdmin();
      allow delete: if false;
    }

    // Order items collection
    match /order_items/{itemId} {
      allow read: if request.auth != null &&
                    (get(/databases/$(database)/documents/orders/$(resource.data.order_id)).data.user_id == request.auth.uid
                     || isAdmin());
      allow create: if request.auth != null;
      allow update: if false;
      allow delete: if false;
    }

    // Community pizzas collection
    match /community_pizzas/{pizzaId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth != null &&
                      (resource.data.created_by == request.auth.uid || isAdmin());
      allow delete: if request.auth != null &&
                      (resource.data.created_by == request.auth.uid || isAdmin());
    }

    // Contests collection
    match /contests/{contestId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && isAdmin();
    }

    // Contest submissions collection
    match /contest_submissions/{submissionId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth != null && isAdmin();
      allow delete: if false;
    }
  }
}
```

## Cara Setup Firestore

1. Buka Firebase Console: https://console.firebase.google.com/
2. Pilih project "pizzart-1"
3. Klik "Firestore Database" di menu sebelah kiri
4. Klik "Create database"
5. Pilih lokasi server (contoh: asia-southeast1 untuk Singapore)
6. Pilih "Start in production mode"
7. Salin Security Rules di atas ke tab "Rules"
8. Buat collection sesuai struktur di atas
9. Import data dummy menggunakan file JSON yang disediakan

## Import Data Dummy

Untuk import data dummy, Anda bisa menggunakan:
1. Firebase Console (manual copy-paste)
2. Firebase Admin SDK (script Node.js)
3. File JSON yang sudah disediakan di folder `firestore-data/`
