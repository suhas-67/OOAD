# TransitBook — Ticket Booking and Reservation System

> **Object-Oriented Analysis and Design (OOAD) Project**  
> Full-Stack Architecture: React (Vite + TypeScript + Tailwind CSS) · Express (Node.js + TypeScript) · SQLite (`better-sqlite3`)

---

## 🚀 Live Demo & Deployment

This project is built and optimized for instant full-stack deployment on **Render**, **Railway**, **Docker**, or any Node.js environment.

### Quick Start (Local Development)
```bash
# 1. Install dependencies for both services
npm run install:all

# 2. Build the project
npm run build

# 3. Start local development
# Terminal 1: Backend API (runs on http://localhost:5000)
npm run dev:backend

# Terminal 2: Frontend UI (runs on http://localhost:5173)
npm run dev:frontend
```

---

## 🔑 Demo Credentials

The database is pre-seeded with realistic sample records:

| Role | Email | Password | Access Capabilities |
|---|---|---|---|
| **System Administrator** | `admin@ticketing.com` | `Password@123` | Complete Admin Dashboard, Schedule CRUD, Ticket Pricing, Seat Inventory, Booking Audits, Refund Approvals, Report Generation |
| **Operations Admin** | `ops.admin@ticketing.com` | `Password@123` | Operational management and vehicle route assignments |
| **Passenger (Alice)** | `alice@email.com` | `Password@123` | Trip Search, Coach Seat Selection, Hold Booking, Card/UPI Payments, E-Ticket Receipts |
| **Passenger (Bob)** | `bob@email.com` | `Password@123` | Multi-seat bookings, reservation cancellation |

---

## 🧩 Architectural Modules (OOAD Traceability)

### Module 1: Login & User Management
- Secure user registration and hashed credential validation (`/api/auth/register`, `/api/auth/login`)
- Profile management and session tracking (`/api/auth/me`)
- Administrator user controls: toggle `Active`, `Inactive`, or `Suspended` statuses

### Module 2: Ticket Search & Reservation
- Multi-modal journey search: source, destination, date, transport type (Train/Bus)
- Real-time seat availability matrix: 24-seat coach grid
- Atomic reservation locks (`INITIATED` status with automated 10-minute hold expiration)

### Module 3: Payment & Booking Management
- Dual-channel payment gateway integration: **Card** and **UPI**
- Automated status progression to `CONFIRMED` upon transaction approval
- E-Ticket generation with unique reference numbers (`TKT-XXXXX`)
- Customer reservation cancellation and automated seat release

### Module 4: Admin & Schedule Management
Directly aligns with the **Module 4 Use Case Diagram**:
1. **Manage Schedule**: Core hub for transit services
   - **Add Schedule**: Deploy new train and bus routes
   - **Update Schedule**: Edit departure/arrival timings, journey dates, fares, and service states
   - **Delete Schedule**: Decommission cancelled services
2. **Manage Ticket Pricing** *(«extend»)*: Configure base fares, peak rush surges (+20%), holiday rates (+40%), and early-bird discounts (-15%)
3. **Manage Seat Inventory** *(«include»)*: Real-time coach seat layout inspection and VIP/maintenance quota holds
4. **Manage Users**: User account audit and status toggling
5. **View Bookings & Approve Refund** *(«include»)*: Passenger reservation audits and payment gateway refund approvals for cancelled bookings
6. **Generate Reports & View Reports** *(«extend»)*: Executive settlements, booking manifest exports (CSV/TXT), and visual analytics

---

## 📦 Deployment Guides

### Option A: 1-Click / Docker Container Deployment
A multi-stage `Dockerfile` is included. It compiles both frontend and backend and serves the entire unified application on port `5000`:
```bash
docker build -t transitbook .
docker run -p 5000:5000 transitbook
```

### Option B: Render / Railway Deployment
1. Connect your repository (`https://github.com/suhas-67/OOAD`)
2. Select **Web Service**
3. Configure settings:
   - **Build Command**: `npm run install:all && npm run build`
   - **Start Command**: `npm start`
   - **Environment Variables**:
     - `PORT=5000`
     - `NODE_ENV=production`
     - `JWT_SECRET=your_production_secret_key`

---

## 📂 Project Structure

```text
code/
├── backend/                  # Express + TypeScript API Server
│   ├── src/
│   │   ├── config/           # Database setup and seed data
│   │   ├── controllers/      # REST API controllers
│   │   ├── middlewares/      # Authentication and error handlers
│   │   ├── models/           # Domain entities
│   │   ├── repositories/     # Data access layer (SQLite)
│   │   ├── routes/           # Express router endpoints
│   │   └── services/         # Business logic
│   └── package.json
├── frontend/                 # React 18 + Vite + Tailwind CSS Single Page App
│   ├── src/
│   │   ├── components/       # UI elements, Modals, Navbar
│   │   ├── pages/            # Passenger and Admin views
│   │   ├── services/         # Axios API clients
│   │   └── types/            # TypeScript domain interfaces
│   └── package.json
├── docs/                     # UML diagrams, artifacts, and reports
├── Dockerfile                # Production multi-stage Docker configuration
├── package.json              # Unified root scripts for production & deployment
└── README.md                 # System overview and deployment guide
```
