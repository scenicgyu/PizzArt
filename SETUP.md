# PizzArt - Pizza Ordering System

Website aplikasi pemesanan pizza dengan fitur admin dashboard, payment QRIS, dan inventory management menggunakan Firebase + Firestore.

## 🏗️ Tech Stack

- **Frontend**: React 18 + TypeScript + Tailwind CSS + Vite
- **Backend**: Firebase (Authentication + Firestore)
- **Payment**: Midtrans QRIS
- **Database**: Firestore (NO Supabase/Bolt)

## 📋 Prerequisites

- Node.js 16+ installed
- Firebase project already created
- Firestore database setup
- Midtrans account for payment processing

## 🚀 Setup Instructions

### 1. Clone & Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Create `.env` file in project root:

```env
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id

VITE_MIDTRANS_CLIENT_KEY=your_midtrans_client_key
```

### 3. Firestore Collections Setup

Create the following collections in Firestore:

#### Collection: `users`
```
- uid (string) - User's Firebase UID
- email (string)
- username (string)
- full_name (string)
- phone (string)
- address (string)
- created_at (timestamp)
```

#### Collection: `orders`
```
- user_id (string) - Reference to user
- user_name (string)
- user_email (string)
- total_price (number)
- status (string) - 'pending' | 'processing' | 'completed' | 'cancelled'
- items (array) - Pizza items
- created_at (timestamp)
- updated_at (timestamp)
```

#### Collection: `payments`
```
- order_id (string)
- user_id (string)
- total_amount (number)
- payment_status (string) - 'pending' | 'success' | 'failed' | 'expired'
- payment_method (string) - 'qris' | 'bank_transfer'
- qris_reference (string)
- transaction_id (string)
- midtrans_order_id (string)
- expiry_time (timestamp)
- paid_at (timestamp)
- created_at (timestamp)
- updated_at (timestamp)
```

#### Collection: `inventory`
```
- name (string)
- category (string) - 'ingredient' | 'crust' | 'sauce' | 'cheese'
- stock_quantity (number)
- low_stock_threshold (number)
- unit (string) - 'pcs' | 'kg' | etc
- price (number)
- is_available (boolean)
- created_at (timestamp)
```

#### Collection: `admin_users`
```
- uid (string) - Firebase Auth UID
- email (string)
- username (string)
- full_name (string)
- role (string) - 'admin' | 'manager'
- created_at (timestamp)
```

### 4. Create Admin User

Add a document to `admin_users` collection:

```json
{
  "email": "admin@pizzart.com",
  "username": "admin",
  "full_name": "Administrator",
  "role": "admin",
  "created_at": "2025-01-01T00:00:00Z"
}
```

Also create corresponding user in Firebase Authentication with same email.

### 5. Run Development Server

```bash
npm run dev
```

Access at `http://localhost:5173`

## 🎯 Features

### User Features
- Browse & customize pizza
- Add to cart
- Checkout dengan QRIS payment
- Track order status
- Share creation to community

### Admin Features
- Dashboard dengan real-time revenue stats
- Order management (view, update status)
- Inventory management (add, edit stock)
- Admin profile management

## 📱 Pages

### Public Pages
- `/` - Home
- `/order` - Order Pizza (Create Pizza)
- `/community` - Community Pizza Gallery
- `/contests` - Pizza Contest
- `/cart` - Shopping Cart
- `/order-tracking` - Track Order

### Auth Pages
- `/login` - User Login
- `/register` - User Registration

### Admin Pages (Protected)
- `/admin/login` - Admin Login
- `/admin/dashboard` - Dashboard
- `/admin/orders` - Order Management
- `/admin/inventory` - Inventory Management
- `/admin/profile` - Admin Profile

## 🔐 Authentication

### User Authentication
- Firebase Email/Password auth
- Protected routes via `ProtectedRoute` component
- Session persistence

### Admin Authentication
- Separate admin table in Firestore
- Verification via `admin_users` collection
- Protected routes via `AdminProtectedRoute` component

## 💳 Payment Flow

1. User selects items & clicks "Bayar"
2. QRISPayment component shows QR code
3. Payment data saved to Firestore `payments` collection
4. Status polling every 5 seconds
5. On success → Order status updated, user redirected

## 🛠️ Development

### Build
```bash
npm run build
```

### Lint
```bash
npm run lint
```

### Type Check
```bash
npm run typecheck
```

## 📁 Project Structure

```
src/
├── components/
│   ├── admin/
│   │   ├── AdminLayout.tsx
│   │   ├── AdminProtectedRoute.tsx
│   │   └── RealtimeRevenue.tsx
│   ├── common/
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   └── ProtectedRoute.tsx
│   ├── payment/
│   │   └── QRISPayment.tsx
│   └── pizza/
│       ├── PizzaBuilder.tsx
│       └── PizzaPreview.tsx
├── context/
│   ├── AdminContext.tsx
│   ├── AppContext.tsx
│   └── UserAuthContext.tsx
├── lib/
│   └── firebase.ts
├── pages/
│   ├── admin/
│   │   ├── AdminDashboardPage.tsx
│   │   ├── AdminOrdersPage.tsx
│   │   ├── AdminInventoryPage.tsx
│   │   ├── AdminLoginPage.tsx
│   │   └── AdminProfilePage.tsx
│   ├── CartPage.tsx
│   ├── CommunityPage.tsx
│   ├── ContestPage.tsx
│   ├── HomePage.tsx
│   ├── LoginPage.tsx
│   ├── OrderPage.tsx
│   └── ...
├── types/
│   └── index.ts
└── App.tsx
```

## 🐛 Troubleshooting

### Admin Dashboard Blank Page
- Verify admin user document exists in Firestore
- Check browser console for errors
- Ensure Firebase auth is initialized

### Payment Not Working
- Check Midtrans client key in .env
- Verify payment collection exists in Firestore
- Check network tab for API errors

### Inventory Not Loading
- Verify inventory items exist in Firestore
- Check collection name matches exactly: `inventory`
- Ensure items have required fields

## 📞 Support

For issues or questions, please check:
1. Browser console for error messages
2. Firestore Firebase console for data
3. Network tab for API calls

## 📄 License

Private Project
