# FoodOrder — Online Food Ordering System
### Full-Stack Database Project with Separated Customer & Admin Panels, JWT Role-Based Security, and PostgreSQL 18

A clean, production-grade, and beginner-friendly Online Food Ordering System built for a college DBMS project and viva presentation. It demonstrates real relational database design, transactions, primary/foreign keys, bcrypt password hashing, JWT role-based access control, privacy-preserving order tracking, aggregations, and multi-table joins using **PostgreSQL 18** and **pgAdmin / psql**.

---

## 📁 1. Project Folder Structure

```text
DBMS miniproject/
├── database/
│   ├── 01_schema.sql           # Core tables: food_categories, menu_items, food_orders, food_order_items
│   ├── 02_seed_data.sql        # Populates 5 categories, 18 dishes with INR prices, & sample orders
│   ├── 03_useful_queries.sql    # Viva queries (SELECT, WHERE, ILIKE, JOINs, GROUP BY, DML)
│   └── 04_admin_migration.sql   # Minimal migration: admin_users table with bcrypt hash & ADMIN role
├── server/
│   ├── config/
│   │   └── database.js         # PostgreSQL connection pool (pg.Pool) & transaction helper
│   ├── middleware/
│   │   └── authMiddleware.js   # JWT authentication & admin role verification middleware
│   ├── routes/
│   │   ├── authRoutes.js       # POST /api/auth/login, GET /api/auth/me, POST /api/auth/logout
│   │   ├── categoryRoutes.js   # GET /api/categories (Public)
│   │   ├── menuRoutes.js       # GET /api/menu (Public), POST/PUT/DELETE /api/menu (Admin only)
│   │   ├── orderRoutes.js      # POST /api/orders (Public COD), GET/PATCH /api/orders (Admin only)
│   │   │                       # GET /api/orders/customer/:phone (Privacy-masked tracking)
│   │   └── adminRoutes.js      # GET /api/admin/stats (Admin analytics & best-sellers)
│   ├── scripts/
│   │   ├── initAdmin.js        # Safe first-admin initializer from environment variables
│   │   └── verify_security.js  # Automated 12-point security and integration test suite
│   ├── app.js                  # Main Express application & health check endpoint
│   ├── package.json            # Backend dependencies & npm scripts (start, dev, init-admin, test)
│   ├── .env                    # Local database & JWT credentials (gitignored)
│   └── .env.example            # Template environment file
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx      # Public customer navigation (Menu, My Orders, Cart - Admin removed)
│   │   │   ├── AdminLogin.jsx  # Dedicated Admin Login page (/admin/login) with show/hide password
│   │   │   ├── AdminView.jsx   # Protected Admin Dashboard with session bar & Logout
│   │   │   ├── OrdersView.jsx  # Privacy-masked customer order tracking
│   │   │   ├── Hero.jsx        # Category filters & instant dish search
│   │   │   ├── MenuCard.jsx    # Food card with INR pricing and Add-to-Cart
│   │   │   ├── CartModal.jsx   # Shopping cart modal with quantity management
│   │   │   └── CheckoutModal.jsx # Cash on Delivery checkout with server recalculation
│   │   ├── services/api.js     # Centralized API client with automatic JWT token attachment
│   │   ├── App.jsx             # Top-level URL routing & route protection logic
│   │   ├── main.jsx            # React 18 DOM mount
│   │   └── index.css           # Modern design system (warm orange & cream accents)
│   ├── package.json            # Frontend dependencies (React 18, Vite, Lucide icons)
│   ├── vite.config.js          # Vite config with API proxy to port 5000
│   ├── .env                    # VITE_API_BASE_URL=http://localhost:5000/api
│   └── .env.example
└── README.md                   # Comprehensive setup, security documentation, and viva guide
```

---

## 🛠️ 2. Technology Stack & Security Architecture

| Layer | Technology | Security & Implementation Role |
| :--- | :--- | :--- |
| **Frontend** | React 18 + Vite | Customer food menu, category filters, interactive cart, checkout, and dedicated `/admin/login` |
| **Backend** | Node.js + Express.js | REST API, bcrypt hashing, JWT authentication, server-side price validation, atomic transactions |
| **Authentication** | `jsonwebtoken` (JWT) | Stateless bearer tokens with 24-hour expiration stored in Http-compatible authorization header |
| **Password Security**| `bcryptjs` | Salted password hashing (10 rounds); administrator passwords are never stored in plaintext |
| **Database Driver** | `pg` (node-postgres) | Connection pool (`pg.Pool`) and 100% parameterized SQL queries (`$1, $2, ...`) preventing SQL injection |
| **Database** | PostgreSQL 18 | Relational data store (`foodorder_db` on port 5432) |
| **Order Privacy** | Server-side masking | Partially masks customer mobile (`98****3210`) and address (`Flat 302***, Bengaluru`) on public lookups |

---

## 🗄️ 3. PostgreSQL Database Setup & Migrations

### Step 3.1: Create the Database (`foodorder_db`)
Using **Windows PowerShell**:
```powershell
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -c "CREATE DATABASE foodorder_db;"
```
*(Enter your PostgreSQL password when prompted)*

### Step 3.2: Run Core Schema (`01_schema.sql`)
```powershell
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -d foodorder_db -f "c:\Users\keswa\DBMS miniproject\database\01_schema.sql"
```

### Step 3.3: Seed Menu Items & Categories (`02_seed_data.sql`)
```powershell
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -d foodorder_db -f "c:\Users\keswa\DBMS miniproject\database\02_seed_data.sql"
```

### Step 3.4: Run Admin Migration (`04_admin_migration.sql`)
This creates the `admin_users` table with strict role enforcement without modifying or dropping any existing tables:
```powershell
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -d foodorder_db -f "c:\Users\keswa\DBMS miniproject\database\04_admin_migration.sql"
```

---

## 🔐 4. Initializing the Administrator Account

Administrator accounts are never registered via an insecure public endpoint. Instead, initialize the first admin account safely via the one-time provisioning script:

1. Configure `server/.env` (or accept the defaults):
```ini
ADMIN_DEFAULT_USER=admin
ADMIN_DEFAULT_EMAIL=admin@foodorder.com
ADMIN_DEFAULT_PASSWORD=Admin@123
JWT_SECRET=foodorder_secure_jwt_secret_key_2026_production
JWT_EXPIRES_IN=24h
```

2. Run the initialization script in the `server` directory:
```powershell
cd "c:\Users\keswa\DBMS miniproject\server"
npm run init-admin
```

*Default Provisioned Admin Credentials:*
- **Username:** `admin` (or `admin@foodorder.com`)
- **Password:** `Admin@123`
- **Role:** `ADMIN`

---

## 🚀 5. Running the Application on Windows

### Step 5.1: Start the Backend Server (Express + PostgreSQL)
Open a PowerShell terminal:
```powershell
cd "c:\Users\keswa\DBMS miniproject\server"
npm start
```
*Backend URL:* [http://localhost:5000](http://localhost:5000)  
*Health Check:* [http://localhost:5000/api/health](http://localhost:5000/api/health)

### Step 5.2: Start the Frontend Application (React + Vite)
Open a **second PowerShell window**:
```powershell
cd "c:\Users\keswa\DBMS miniproject\client"
npm run dev
```
*Frontend Customer Website:* [http://localhost:5173/](http://localhost:5173/)  
*Dedicated Admin Portal Login:* [http://localhost:5173/admin/login](http://localhost:5173/admin/login)

---

## 🧪 6. Automated Testing

To run the automated 12-point security and integration test suite:
```powershell
cd "c:\Users\keswa\DBMS miniproject\server"
npm test
```

### Automated Verification Results
```text
====================================================
  RUNNING FOODORDER INTEGRATION & SECURITY TESTS    
====================================================

  [PASS] Public visitor can browse menu (HTTP 200)
  [PASS] Public visitor can fetch categories (HTTP 200)
  [PASS] Direct call to /api/admin/stats without token returns 401 Unauthorized
  [PASS] Direct call to /api/orders without token returns 401 Unauthorized
  [PASS] Creating menu item without admin token returns 401 Unauthorized
  [PASS] Admin login with invalid credentials rejected (HTTP 401)
  [PASS] Admin login with valid credentials succeeds with JWT token
  [PASS] Token verification via /api/auth/me returns valid admin role
  [PASS] Authenticated admin can retrieve analytics dashboard stats
  [PASS] Authenticated admin can view customer orders
  [PASS] Customer order tracking masks sensitive phone numbers and addresses
  [PASS] Customer COD checkout succeeds with server-side price recalculation & transaction

====================================================
  TEST RESULTS: 12 PASSED, 0 FAILED
====================================================
```

To test the frontend production bundle:
```powershell
cd "c:\Users\keswa\DBMS miniproject\client"
npm run build
```

---

## 🎓 7. Viva Demonstration & Verification Guide

1. **Demonstrating Separation of Panels:**
   - Open [http://localhost:5173/](http://localhost:5173/). Point out that the navigation contains only **FoodOrder logo**, **Menu**, **My Orders**, and **Cart**. There is **no Admin button** visible to customers.
2. **Accessing Protected Route Without Auth:**
   - Type [http://localhost:5173/admin](http://localhost:5173/admin) directly in the browser address bar.
   - Observe how the application immediately intercepts the request and redirects to `/admin/login`.
3. **Admin Authentication:**
   - At `/admin/login`, attempt an invalid password to show proper error validation.
   - Enter `admin` and `Admin@123` (use the eye icon to test show/hide password). Click **Sign In to Admin Portal**.
   - You are redirected to the protected Admin Dashboard with the logged-in administrator badge (`Role: ADMIN`).
4. **Admin Operations:**
   - Update an order's status (e.g., from `PLACED` to `PREPARING` or `DELIVERED`).
   - Add or edit a menu item.
5. **Customer Order Privacy:**
   - Navigate back to the customer site via the **Customer View** button.
   - Go to **My Orders** and search by phone number `9422779578`.
   - Point out to the examiner that sensitive customer mobile numbers and street addresses are partially masked (`98****3210`, `Flat 302***, Bengaluru`) to protect customer personal data.
6. **Cash on Delivery Checkout & Atomic Transactions:**
   - Add items to your cart, click **Checkout**, enter details, and submit.
   - Explain to the examiner how `orderRoutes.js` uses `BEGIN`, recalculates prices server-side from `menu_items`, inserts into `food_orders` and `food_order_items`, and executes `COMMIT` (or `ROLLBACK` on error).
