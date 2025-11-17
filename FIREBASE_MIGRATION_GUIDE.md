# Firebase Migration & Google Drive Integration Guide

## Overview

Project ini menggunakan:
- **Firebase Authentication** untuk autentikasi user
- **Firestore** sebagai database utama
- **Google Drive API** untuk penyimpanan gambar
- **Firebase Storage** (optional fallback)

## 1. Firestore Collections Structure

### Collection: `payments`

Menyimpan data transaksi pembayaran (migrasi dari Supabase payments table).

**Document Structure:**
```typescript
{
  id: string;                    // Auto-generated document ID
  order_id: string;              // Reference ke orders collection
  user_id: string;               // Firebase Auth UID
  items: Array<{                 // Pizza items dalam order
    pizza_name: string;
    size: string;
    crust: string;
    sauce: string;
    toppings: Array<any>;
    quantity: number;
    price: number;
  }>;
  total_amount: number;          // Total pembayaran
  payment_status: string;        // 'pending' | 'success' | 'failed' | 'expired'
  payment_method: string;        // 'qris' | 'bank_transfer' | 'credit_card'
  qris_reference: string;        // QR code URL dari Midtrans
  transaction_id: string;        // Midtrans transaction ID
  midtrans_order_id: string;     // Unique order ID untuk Midtrans
  expiry_time: timestamp;        // Waktu kedaluwarsa pembayaran
  paid_at: timestamp | null;     // Timestamp pembayaran sukses
  metadata: object;              // Data tambahan dari Midtrans
  created_at: timestamp;         // Firestore serverTimestamp()
  updated_at: timestamp;         // Firestore serverTimestamp()
}
```

**Example Document:**
```json
{
  "id": "pay_abc123xyz",
  "order_id": "order_xyz789",
  "user_id": "user_uid_12345",
  "items": [
    {
      "pizza_name": "Dragon Fire Special",
      "size": "large",
      "crust": "thick",
      "sauce": "spicy",
      "toppings": [
        { "name": "Pepperoni", "category": "meat" },
        { "name": "Bell Peppers", "category": "vegetable" }
      ],
      "quantity": 2,
      "price": 178000
    }
  ],
  "total_amount": 178000,
  "payment_status": "success",
  "payment_method": "qris",
  "qris_reference": "https://api.midtrans.com/qris/...",
  "transaction_id": "mt_txn_abc123",
  "midtrans_order_id": "ORDER-xyz789-1234567890",
  "expiry_time": "2025-01-20T10:30:00Z",
  "paid_at": "2025-01-20T10:15:00Z",
  "metadata": {
    "notification": { ... }
  },
  "created_at": "2025-01-20T10:00:00Z",
  "updated_at": "2025-01-20T10:15:00Z"
}
```

### Collection: `community_pizzas`

Menyimpan pizza kreasi user yang dibagikan ke komunitas.

**Document Structure:**
```typescript
{
  id: string;                    // Auto-generated document ID
  name: string;                  // Nama pizza
  size: string;                  // 'small' | 'medium' | 'large'
  crust: string;                 // 'thin' | 'thick' | 'stuffed'
  sauce: string;                 // Base sauce
  toppings: Array<{
    name: string;
    category: string;
  }>;
  price: number;                 // Estimasi harga
  image_url: string;             // *** Google Drive public link ***
  google_drive_file_id: string;  // File ID di Google Drive
  created_by: string;            // User ID (Firebase Auth UID)
  created_by_username: string;   // Username untuk display
  caption: string;               // Deskripsi/caption dari user
  likes: number;                 // Jumlah likes
  created_at: timestamp;
  updated_at: timestamp;
}
```

**Example Document:**
```json
{
  "id": "pizza_abc123",
  "name": "Dragon Fire Special",
  "size": "large",
  "crust": "thick",
  "sauce": "spicy",
  "toppings": [
    { "name": "Pepperoni", "category": "meat" },
    { "name": "Bell Peppers", "category": "vegetable" }
  ],
  "price": 89000,
  "image_url": "https://drive.google.com/uc?id=FILE_ID&export=view",
  "google_drive_file_id": "1AbCdEfGhIjKlMnOpQrStUvWxYz",
  "created_by": "user_uid_12345",
  "created_by_username": "pizza_master",
  "caption": "Pizza pedas favorit saya!",
  "likes": 247,
  "created_at": "2025-01-20T10:00:00Z",
  "updated_at": "2025-01-20T10:00:00Z"
}
```

### Collection: `contest_submissions`

Menyimpan submission untuk kontes pizza.

**Document Structure:**
```typescript
{
  id: string;                    // Auto-generated document ID
  contest_id: string;            // Reference ke contests collection
  user_id: string;               // Firebase Auth UID
  contestant_name: string;       // Nama kontestan (username)
  pizza_name: string;            // Nama pizza kreasi
  description: string;           // Deskripsi kreasi
  image_url: string;             // *** Google Drive public link ***
  google_drive_file_id: string;  // File ID di Google Drive
  votes: number;                 // Jumlah vote
  pizza_data: object;            // Detail pizza (size, crust, toppings, dll)
  created_at: timestamp;
  updated_at: timestamp;
}
```

**Example Document:**
```json
{
  "id": "submission_xyz789",
  "contest_id": "contest_summer_2025",
  "user_id": "user_uid_12345",
  "contestant_name": "pizza_master",
  "pizza_name": "Summer Tropical Blast",
  "description": "Pizza dengan kombinasi topping segar yang perfect untuk musim panas!",
  "image_url": "https://drive.google.com/uc?id=FILE_ID&export=view",
  "google_drive_file_id": "1XyZaBcDeFgHiJkLmNoPqRsTuVw",
  "votes": 156,
  "pizza_data": {
    "size": "large",
    "crust": "thin",
    "sauce": "white",
    "toppings": [
      { "name": "Pineapple", "category": "vegetable" },
      { "name": "Ham", "category": "meat" }
    ]
  },
  "created_at": "2025-01-20T10:00:00Z",
  "updated_at": "2025-01-20T10:00:00Z"
}
```

---

## 2. Google Drive Integration

### Setup Google Drive API

1. **Enable Google Drive API**
   - Go to Google Cloud Console
   - Create/Select project
   - Enable "Google Drive API"

2. **Create Service Account**
   - IAM & Admin → Service Accounts
   - Create Service Account
   - Generate JSON key
   - Save as `service-account-key.json`

3. **Share Google Drive Folder**
   - Create folder di Google Drive
   - Share folder dengan service account email
   - Give "Editor" permission
   - Copy Folder ID dari URL

4. **Environment Variables**
```env
# .env
VITE_GOOGLE_DRIVE_FOLDER_ID=your_folder_id_here
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@project.iam.gserviceaccount.com
```

### Upload Workflow

```
User selects image
    ↓
Frontend: Convert to base64/blob
    ↓
Send to Backend API (Firebase Function)
    ↓
Backend: Upload to Google Drive
    ↓
Get public share URL
    ↓
Return URL to Frontend
    ↓
Frontend: Save URL to Firestore
    ↓
Display image from Google Drive URL
```

---

## 3. Firebase Functions for Google Drive Upload

### Function: `uploadToGoogleDrive`

**Location:** `functions/src/uploadToGoogleDrive.ts`

```typescript
import * as functions from 'firebase-functions';
import { google } from 'googleapis';
import * as admin from 'firebase-admin';
import { Readable } from 'stream';

const serviceAccount = require('../service-account-key.json');

const auth = new google.auth.GoogleAuth({
  credentials: serviceAccount,
  scopes: ['https://www.googleapis.com/auth/drive.file'],
});

const drive = google.drive({ version: 'v3', auth });

export const uploadToGoogleDrive = functions.https.onCall(async (data, context) => {
  // Verify authentication
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { imageData, fileName, mimeType, folderType } = data;
  // folderType: 'community' | 'contest'

  try {
    const folderId = functions.config().gdrive.folder_id;

    // Convert base64 to buffer
    const buffer = Buffer.from(imageData, 'base64');
    const stream = Readable.from(buffer);

    // Upload file to Google Drive
    const response = await drive.files.create({
      requestBody: {
        name: fileName,
        parents: [folderId],
      },
      media: {
        mimeType: mimeType,
        body: stream,
      },
      fields: 'id, webViewLink, webContentLink',
    });

    const fileId = response.data.id!;

    // Make file public
    await drive.permissions.create({
      fileId: fileId,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    });

    // Generate direct view URL
    const publicUrl = `https://drive.google.com/uc?id=${fileId}&export=view`;

    return {
      success: true,
      fileId: fileId,
      publicUrl: publicUrl,
      webViewLink: response.data.webViewLink,
    };
  } catch (error) {
    console.error('Error uploading to Google Drive:', error);
    throw new functions.https.HttpsError('internal', 'Failed to upload file');
  }
});
```

---

## 4. Frontend Implementation

### Upload Component

**File:** `src/components/upload/ImageUploader.tsx`

```typescript
import React, { useState } from 'react';
import { Upload, Loader } from 'lucide-react';
import { getFunctions, httpsCallable } from 'firebase/functions';

interface ImageUploaderProps {
  onUploadSuccess: (url: string, fileId: string) => void;
  folderType: 'community' | 'contest';
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onUploadSuccess, folderType }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);

    // Upload to Google Drive
    setIsUploading(true);

    try {
      const base64 = await fileToBase64(file);
      const functions = getFunctions();
      const uploadFunction = httpsCallable(functions, 'uploadToGoogleDrive');

      const result = await uploadFunction({
        imageData: base64.split(',')[1], // Remove data:image/jpeg;base64, prefix
        fileName: `${Date.now()}-${file.name}`,
        mimeType: file.type,
        folderType: folderType,
      });

      const data = result.data as any;

      if (data.success) {
        onUploadSuccess(data.publicUrl, data.fileId);
        alert('Image uploaded successfully!');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  return (
    <div className="space-y-4">
      <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">
        {preview ? (
          <div className="space-y-4">
            <img src={preview} alt="Preview" className="max-h-64 mx-auto rounded-lg" />
            <button
              onClick={() => {
                setPreview(null);
                (document.getElementById('image-input') as HTMLInputElement).value = '';
              }}
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              Change Image
            </button>
          </div>
        ) : (
          <label htmlFor="image-input" className="cursor-pointer">
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">Click to upload image</p>
            <p className="text-sm text-gray-400">PNG, JPG up to 5MB</p>
          </label>
        )}
        <input
          id="image-input"
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          disabled={isUploading}
          className="hidden"
        />
      </div>

      {isUploading && (
        <div className="flex items-center justify-center gap-2 text-blue-600">
          <Loader className="w-5 h-5 animate-spin" />
          <span>Uploading to Google Drive...</span>
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
```

### Save to Firestore

**File:** `src/services/firestoreService.ts`

```typescript
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp, query, orderBy, getDocs } from 'firebase/firestore';

// Save community pizza with image
export const saveCommunityPizza = async (pizzaData: any, imageUrl: string, fileId: string) => {
  try {
    const docRef = await addDoc(collection(db, 'community_pizzas'), {
      ...pizzaData,
      image_url: imageUrl,
      google_drive_file_id: fileId,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });

    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error saving community pizza:', error);
    return { success: false, error };
  }
};

// Save contest submission with image
export const saveContestSubmission = async (submissionData: any, imageUrl: string, fileId: string) => {
  try {
    const docRef = await addDoc(collection(db, 'contest_submissions'), {
      ...submissionData,
      image_url: imageUrl,
      google_drive_file_id: fileId,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });

    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error saving contest submission:', error);
    return { success: false, error };
  }
};

// Get community pizzas
export const getCommunityPizzas = async () => {
  try {
    const q = query(collection(db, 'community_pizzas'), orderBy('created_at', 'desc'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error('Error getting community pizzas:', error);
    return [];
  }
};

// Get contest submissions
export const getContestSubmissions = async (contestId?: string) => {
  try {
    let q;
    if (contestId) {
      q = query(
        collection(db, 'contest_submissions'),
        orderBy('created_at', 'desc')
      );
    } else {
      q = query(collection(db, 'contest_submissions'), orderBy('created_at', 'desc'));
    }

    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error('Error getting contest submissions:', error);
    return [];
  }
};
```

---

## 5. Display Images from Google Drive

### Community Gallery Component

```typescript
import React, { useEffect, useState } from 'react';
import { getCommunityPizzas } from '../services/firestoreService';

const CommunityGallery: React.FC = () => {
  const [pizzas, setPizzas] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPizzas();
  }, []);

  const loadPizzas = async () => {
    const data = await getCommunityPizzas();
    setPizzas(data);
    setIsLoading(false);
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {pizzas.map((pizza) => (
        <div key={pizza.id} className="bg-white rounded-xl shadow-lg overflow-hidden">
          <img
            src={pizza.image_url}
            alt={pizza.name}
            className="w-full h-64 object-cover"
            onError={(e) => {
              // Fallback jika gambar gagal load
              e.currentTarget.src = '/placeholder-pizza.png';
            }}
          />
          <div className="p-4">
            <h3 className="font-bold text-lg">{pizza.name}</h3>
            <p className="text-gray-600 text-sm">{pizza.caption}</p>
            <p className="text-gray-500 text-xs mt-2">
              by @{pizza.created_by_username}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CommunityGallery;
```

---

## 6. Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Payments
    match /payments/{paymentId} {
      allow read: if request.auth != null &&
                    (resource.data.user_id == request.auth.uid || isAdmin());
      allow create: if request.auth != null;
      allow update: if request.auth != null && isAdmin();
      allow delete: if false;
    }

    // Community Pizzas
    match /community_pizzas/{pizzaId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null &&
                      request.resource.data.created_by == request.auth.uid;
      allow update: if request.auth != null &&
                      (resource.data.created_by == request.auth.uid || isAdmin());
      allow delete: if request.auth != null &&
                      (resource.data.created_by == request.auth.uid || isAdmin());
    }

    // Contest Submissions
    match /contest_submissions/{submissionId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null &&
                      request.resource.data.user_id == request.auth.uid;
      allow update: if request.auth != null && isAdmin();
      allow delete: if false;
    }

    function isAdmin() {
      return exists(/databases/$(database)/documents/admin_users/$(request.auth.uid));
    }
  }
}
```

---

## 7. Migration Steps

### From Supabase to Firestore

1. **Export Supabase Data**
   - Export payments table as JSON
   - Transform to Firestore format

2. **Import to Firestore**
   - Use Firebase Admin SDK
   - Batch write documents

3. **Update Frontend**
   - Replace Supabase client with Firestore
   - Update all queries

4. **Test**
   - Verify all features work
   - Check payment flow
   - Test image upload

---

## 8. Complete Example: Share to Community

```typescript
import React, { useState } from 'react';
import ImageUploader from '../components/upload/ImageUploader';
import { saveCommunityPizza } from '../services/firestoreService';
import { useUserAuth } from '../context/UserAuthContext';

const SharePizzaPage: React.FC = () => {
  const { user } = useUserAuth();
  const [uploadedImageUrl, setUploadedImageUrl] = useState('');
  const [uploadedFileId, setUploadedFileId] = useState('');
  const [caption, setCaption] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleUploadSuccess = (url: string, fileId: string) => {
    setUploadedImageUrl(url);
    setUploadedFileId(fileId);
  };

  const handleSubmit = async () => {
    if (!uploadedImageUrl || !caption.trim()) {
      alert('Please upload image and add caption');
      return;
    }

    setIsSubmitting(true);

    const pizzaData = {
      name: 'My Pizza Creation',
      caption: caption,
      created_by: user.id,
      created_by_username: user.username,
      likes: 0,
      // ... other pizza details
    };

    const result = await saveCommunityPizza(pizzaData, uploadedImageUrl, uploadedFileId);

    if (result.success) {
      alert('Pizza shared to community!');
      // Redirect to community page
    } else {
      alert('Failed to share pizza');
    }

    setIsSubmitting(false);
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Share Your Pizza</h1>

      <ImageUploader
        onUploadSuccess={handleUploadSuccess}
        folderType="community"
      />

      {uploadedImageUrl && (
        <div className="mt-6">
          <img src={uploadedImageUrl} alt="Preview" className="rounded-lg" />
        </div>
      )}

      <div className="mt-6">
        <label className="block font-semibold mb-2">Caption</label>
        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          className="w-full border rounded-lg p-3"
          rows={4}
          placeholder="Tell us about your pizza creation..."
        />
      </div>

      <button
        onClick={handleSubmit}
        disabled={isSubmitting || !uploadedImageUrl}
        className="mt-6 w-full bg-red-600 text-white py-3 rounded-lg font-semibold"
      >
        {isSubmitting ? 'Sharing...' : 'Share to Community'}
      </button>
    </div>
  );
};

export default SharePizzaPage;
```

---

## Summary

**Firestore Collections:**
- `payments` - Payment transactions
- `community_pizzas` - User pizza creations with images
- `contest_submissions` - Contest submissions with images

**Google Drive Integration:**
- Upload via Firebase Functions
- Store public URLs in Firestore
- Display images from Google Drive links

**Key Features:**
- Automatic upload to Google Drive
- Public share URL generation
- Firestore document creation
- Real-time display from Firestore

**Next Steps:**
1. Setup Google Drive API & Service Account
2. Deploy Firebase Functions
3. Test upload workflow
4. Migrate existing data from Supabase
