# Lead Management CRM (MERN Stack)

A full-stack **Lead Management CRM** application built with MongoDB, Express.js, React, and Node.js (MERN) styled with Tailwind CSS. It allows sales teams and individuals to manage prospective customers, track status across sales stages, visualize statistics on a central dashboard, and isolate leads per authenticated user.

---

## 🚀 Key Features

- **Authentication & Security**
  - User Registration and Login with password hashing (`bcryptjs`)
  - Stateless JSON Web Token (`JWT`) authentication with custom middleware
  - **Google OAuth 2.0** Sign-In (using Passport.js) + Demo Sign-In mode
  - Protected frontend routes and API endpoints
  - Multi-tenant data isolation: Each user only accesses and manages their own leads

- **Lead Management (CRUD)**
  - Add new leads with contact details, company, source, status, and notes
  - View list of leads with responsive table view
  - Edit and update existing leads
  - Delete leads with a confirmation modal

- **Search, Filter, Sort & Pagination**
  - Real-time search across lead name, email, and company
  - Status filter: `New`, `Contacted`, `Qualified`, `Proposal`, `Won`, `Lost`
  - Sorting: Newest First, Oldest First, Name (A - Z)
  - Server-side pagination with custom page controls

- **Dashboard & Analytics**
  - Pipeline metrics cards: Total Leads, New, Contacted, Qualified, Won, Lost
  - Recent Leads quick table with direct navigation

- **Validation & User Experience**
  - Frontend input validation and email format verification
  - Backend Mongoose validation with clean error responses
  - Loading spinners, error recovery states, and toast notifications (`react-hot-toast`)

---

## 🛠️ Tech Stack

- **Frontend (`client1`)**:
  - React 19 + Vite
  - React Router DOM v7 (Routing & Protected Routes)
  - Tailwind CSS (Responsive styling)
  - Axios (Centralized API client with auth interceptors)
  - React Hot Toast (Toast notifications)
- **Backend (`server`)**:
  - Node.js & Express.js
  - MongoDB & Mongoose ORM
  - JWT (`jsonwebtoken`) & `bcryptjs`
  - Passport.js with `passport-google-oauth20`
  - CORS, dotenv, cookie-parser

---

## 📂 Project Structure

```text
Lead-Management-CRM-Node-Starter/
├── client1/               # React Vite Frontend
│   ├── src/
│   │   ├── components/    # Reusable UI (Navbar, ProtectedRoute, ConfirmModal)
│   │   ├── pages/         # Login, Signup, Dashboard, Leads, AddLead, EditLead
│   │   ├── services/      # api.js (Axios instance with JWT interceptor)
│   │   ├── App.jsx        # Route definitions
│   │   ├── index.css      # Tailwind base styles
│   │   └── main.jsx       # React DOM root
│   ├── .env.example       # Frontend environment variables template
│   └── package.json
│
├── server/                # Node.js + Express Backend
│   ├── src/
│   │   ├── config/        # db.js (MongoDB connection)
│   │   ├── middleware/    # auth.middleware.js (JWT authentication)
│   │   ├── models/        # User.js & Lead.js (Mongoose schemas)
│   │   ├── routes/        # auth.routes.js & lead.routes.js
│   │   └── index.js       # Express server entry point
│   ├── .env.example       # Backend environment variables template
│   └── package.json
│
├── .env.example           # Root reference environment template
├── package.json           # Root workspaces configuration
└── README.md              # Project documentation
```

---

## ⚙️ Installation & Setup

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [MongoDB](https://www.mongodb.com/) running locally (port `27017`) or a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster

### 2. Clone and Install Dependencies

From the project root:

```bash
# Install root and workspace dependencies
npm install
```

Or install individually:
```bash
# In server folder
cd server
npm install

# In client1 folder
cd ../client1
npm install
```

---

## 🔑 Environment Variables Setup

### Backend (`server/.env`)
Create a file named `.env` inside the `server/` directory:

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/lead_crm
JWT_SECRET=your_super_secret_jwt_key_here
CLIENT_URL=http://localhost:5173

# Optional: Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
```

### Frontend (`client1/.env`)
Create a file named `.env` inside the `client1/` directory:

```env
VITE_API_URL=http://localhost:5000/api
```

---

## 🌐 Google OAuth Setup (Optional)

To enable real Google Sign-In:

1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project (e.g. `Lead-CRM`).
3. Navigate to **APIs & Services > OAuth consent screen**:
   - Choose **External** and complete the basic app details.
4. Navigate to **APIs & Services > Credentials**:
   - Click **Create Credentials > OAuth Client ID**.
   - Application type: **Web application**.
   - **Authorized JavaScript origins**:
     - `http://localhost:5173`
   - **Authorized redirect URIs**:
     - `http://localhost:5000/api/auth/google/callback`
5. Copy the generated **Client ID** and **Client Secret** into your `server/.env` file.
6. Restart the backend server.

*(Note: If you run without Google credentials configured, you can test Google login immediately using the built-in demo sign-in option!)*

---

## 🏃 Running the Application

### Option A: Run Both Together (Recommended)
From the project root:

```bash
npm run dev
```

This starts:
- Frontend on **`http://localhost:5173`**
- Backend on **`http://localhost:5000`**

### Option B: Run Separately

**Start the Server:**
```bash
cd server
npm run dev
```

**Start the Client:**
```bash
cd client1
npm run dev
```

---

## 📡 REST API Reference

### Authentication (`/api/auth`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register new user | Public |
| `POST` | `/api/auth/login` | Login with email and password | Public |
| `POST` | `/api/auth/logout` | Logout and clear cookie | Public |
| `GET` | `/api/auth/me` | Fetch current logged-in user | Private (JWT) |
| `GET` | `/api/auth/google` | Trigger Google OAuth 2.0 redirect | Public |
| `GET` | `/api/auth/google/callback` | Google OAuth callback handler | Public |
| `POST` | `/api/auth/demo-google` | Instant Google demo authentication | Public |

### Leads (`/api/leads`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/leads` | Get paginated leads (supports `search`, `status`, `sort`, `page`, `limit`) | Private (JWT) |
| `GET` | `/api/leads/stats` | Get pipeline counts (Total, New, Qualified, Won, etc.) | Private (JWT) |
| `GET` | `/api/leads/:id` | Get details of a single lead | Private (JWT) |
| `POST` | `/api/leads` | Create a new lead | Private (JWT) |
| `PUT` | `/api/leads/:id` | Update an existing lead | Private (JWT) |
| `DELETE` | `/api/leads/:id` | Delete a lead | Private (JWT) |

---

## 🛡️ Technical Implementation Highlights

1. **User Data Isolation (Multi-Tenancy)**:
   Every lead is saved with `user: req.user._id`. All database queries (`find`, `findOne`, `findOneAndUpdate`, `findOneAndDelete`) enforce `{ _id: id, user: req.user._id }`, preventing users from reading or mutating other users' data.

2. **Clean Auth Interceptors**:
   The frontend Axios client (`client1/src/services/api.js`) automatically attaches the JWT `Bearer` token to headers and redirects cleanly on `401 Unauthorized` responses.

3. **Backend Validation**:
   Inputs are sanitized and validated with regular expressions and Mongoose schemas to avoid bad data and provide clear, human-readable error messages.
