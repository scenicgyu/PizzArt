# Quick Setup - User vs Admin Separation

## TL;DR

Admin dan user harus login ke halaman berbeda dengan akun berbeda di Firestore.

## 3-Step Setup

### 1. Buat Akun di Firebase Auth Console

**User Account:**
```
Email: user@example.com
Password: password123
```
Copy UID (misal: `user_uid_123`)

**Admin Account:**
```
Email: admin@example.com
Password: admin123
```
Copy UID (misal: `admin_uid_456`)

### 2. Buat Documents di Firestore

**Collection `users` → Document `user_uid_123`:**
```
id: user_uid_123
email: user@example.com
username: user123
full_name: John Doe
phone: 08123456789
address: Jl. Contoh No. 123
points: 0
created_at: (now)
updated_at: (now)
```

**Collection `admin_users` → Document `admin_uid_456`:**
```
id: admin_uid_456
email: admin@example.com
username: administrator
created_at: (now)
updated_at: (now)
```

### 3. Update Firestore Security Rules

Firebase Console → Firestore → Rules → Replace dengan:

```sql
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
    }
    match /admin_users/{adminId} {
      allow read, write: if request.auth.uid == adminId;
    }
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

Click **PUBLISH**

## Test

**User Login:**
- Go to `http://localhost/login`
- Email: `user@example.com`, Password: `password123`
- Should see red/yellow dashboard

**Admin Login:**
- Go to `http://localhost/admin/login`
- Email: `admin@example.com`, Password: `admin123`
- Should see navy/white admin dashboard

## Expected Behavior

| Akun | Login Page | Result |
|------|-----------|--------|
| user@example.com | `/login` | ✅ Success, user dashboard |
| user@example.com | `/admin/login` | ❌ "Akun ini bukan admin" |
| admin@example.com | `/login` | ❌ "Silakan login melalui laman admin" |
| admin@example.com | `/admin/login` | ✅ Success, admin dashboard |

## If Not Working

1. **Check Firestore Console:**
   - Make sure `users` collection exists
   - Make sure `admin_users` collection exists
   - Verify document ID = UID from Firebase Auth

2. **Check Security Rules:**
   - Rules status should be "Published" (not Draft)
   - Wait 1-2 minutes after publishing

3. **Check Browser Console (F12):**
   - Should see error message explaining what's wrong
   - Look for permission errors or document not found errors

4. **Clear Cache:**
   - Press Ctrl+F5 (or Cmd+Shift+R on Mac)

