# Comprehensive Fullstack Deployment Guide: Fantasy Cricket Platform

> **End-to-End Production Deployment Documentation**  
> **Frontend:** Vercel (React + Vite + TanStack Start)  
> **Backend:** Render (Node.js + Express + TypeScript)  
> **Database:** MongoDB Atlas (Cloud Database with Local DB Migration)

---

## 📑 Table of Contents
1. [Architecture & Project Structure](#1-architecture--project-structure)
2. [Local Development Setup](#2-local-development-setup)
3. [Git Workflow: From Scratch to Continuous Deployment](#3-git-workflow-from-scratch-to-continuous-deployment)
4. [MongoDB Atlas Setup & Local DB Migration](#4-mongodb-atlas-setup--local-db-migration)
   - [Common MongoDB Issues & Fixes](#common-mongodb-issues--fixes)
5. [Backend Deployment on Render](#5-backend-deployment-on-render)
   - [Step-by-Step Render Configuration](#step-by-step-render-configuration)
   - [Environment Variables Reference](#environment-variables-reference)
   - [Common Render Build/Runtime Issues & Fixes](#common-render-buildruntime-issues--fixes)
6. [Frontend Deployment on Vercel](#6-frontend-deployment-on-vercel)
   - [Step-by-Step Vercel Configuration](#step-by-step-vercel-configuration)
   - [Common Vercel Issues & Fixes](#common-vercel-issues--fixes)
7. [Post-Deployment Fullstack Checklist & Maintenance](#7-post-deployment-fullstack-checklist--maintenance)

---

## 1. Architecture & Project Structure

The project is structured as a **Monorepo** containing two independent applications:

```
Fantasy-Cricket-Integrated/
├── API/                       # Backend Application (Node.js + Express + TypeScript)
│   ├── src/
│   │   ├── config/            # Database connection, env, seeders
│   │   ├── controllers/       # Route controllers (Auth, Matches, Teams, Contests)
│   │   ├── models/            # Mongoose Schemas (User, Match, Player, Contest, etc.)
│   │   ├── routes/            # Express Routers
│   │   ├── scripts/           # Migration utility (migrate.js)
│   │   ├── services/          # Business logic & scoring workers
│   │   ├── utils/             # Mailer, logger, password hashing, JWT
│   │   └── server.ts          # Server entry point
│   ├── package.json           # Backend dependencies & build scripts
│   ├── tsconfig.json          # TypeScript compiler configuration
│   └── .env                   # Local environment variables
│
├── UI/                        # Frontend Application (React + Vite + TanStack Start)
│   ├── src/
│   │   ├── components/        # UI components, AppShell, Layouts, Fields
│   │   ├── lib/               # API clients, auth helpers, flow state
│   │   └── routes/            # TanStack file-based routes (/matches, /contests, etc.)
│   ├── public/                # Static assets, icons, favicons
│   ├── package.json           # Frontend dependencies
│   ├── vite.config.ts         # Vite build configuration
│   └── vercel.json            # Vercel deployment configuration
│
├── package.json               # Root monorepo script runner
└── DEPLOYMENT_GUIDE.md        # This deployment documentation
```

---

## 2. Local Development Setup

### 2.1 Prerequisites
- **Node.js**: v18.0.0 or newer
- **npm**: v9.0.0 or newer
- **Local MongoDB**: MongoDB Community Server running locally on `mongodb://127.0.0.1:27017`

### 2.2 Installing Dependencies
Open terminal in the project root:

```bash
# Install backend dependencies
cd API
npm install

# Install frontend dependencies
cd ../UI
npm install

# Return to root
cd ..
```

### 2.3 Local Environment Files
Create/verify `API/.env`:
```env
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:8080
MONGO_URI=mongodb://127.0.0.1:27017/fantasy_cricket
JWT_ACCESS_SECRET=dev_access_secret_change_me
JWT_REFRESH_SECRET=dev_refresh_secret_change_me
JWT_ACCESS_EXPIRES_IN=2d
JWT_REFRESH_EXPIRES_IN=7d
OTP_LENGTH=6
OTP_EXPIRES_IN_MINUTES=5
OTP_RESEND_COOLDOWN_SECONDS=30
OTP_MAX_ATTEMPTS=5
OTP_MAX_RESEND_PER_WINDOW=5
MAIL_FROM=vikass78901@gmail.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=vikass78901@gmail.com
SMTP_PASS=lwvrqtwrvxczfnvh
SMTP_SECURE=false
RATE_LIMIT_WINDOW_MINUTES=15
RATE_LIMIT_MAX=2000
```

### 2.4 Starting Local Servers
- **Backend**: In `API` directory &rarr; `npm run dev` (Runs on `http://localhost:5000`)
- **Frontend**: In `UI` directory &rarr; `npm run dev` (Runs on `http://localhost:8080`)
- **Test Endpoint**: Open `http://localhost:5000/api/health` &rarr; Returns `{ "success": true, "message": "OK" }`.

---

## 3. Git Workflow: From Scratch to Continuous Deployment

### 3.1 Initial Git Setup (One-time)
If initializing a repository from scratch:

```bash
# 1. Initialize git in the root folder
git init

# 2. Stage all files
git add .

# 3. Create initial commit
git commit -m "feat: initial commit of fantasy cricket platform"

# 4. Set default branch to main
git branch -M main

# 5. Link to your GitHub repository
git remote add origin https://github.com/<your-username>/<repo-name>.git

# 6. Push code to GitHub
git push -u origin main
```

### 3.2 Ongoing Code Updates (Pushing Changes)
Whenever you modify code (e.g. UI tweaks, backend bug fixes, env updates):

```bash
# 1. Check changed files
git status

# 2. Stage all modified files
git add .

# 3. Commit with a meaningful description
git commit -m "fix: update UI styles and backend auth logic"

# 4. Push to GitHub
git push origin main
```

> [!NOTE]
> Both **Vercel** and **Render** listen to your `main` branch. Every time you run `git push origin main`, both platforms automatically trigger new builds and deploy the updated code live within 1–2 minutes!

---

## 4. MongoDB Atlas Setup & Local DB Migration

Render cloud servers cannot access `mongodb://127.0.0.1:27017` (your laptop's localhost). Therefore, a free cloud database on **MongoDB Atlas** is required.

### 4.1 Step-by-Step Atlas Setup

1. **Create Account**: Go to [cloud.mongodb.com](https://cloud.mongodb.com/) and Sign In.
2. **Create Free Cluster**:
   - Click **Create a deployment** &rarr; Select **M0 (Free Tier)**.
   - Provider: **AWS**, Region: **Mumbai (`ap-south-1`)** or Singapore.
   - Click **Create Deployment**.
3. **Create Database User**:
   - Left menu &rarr; **Database Access** &rarr; **Add New Database User**.
   - Authentication: **Password**.
   - Username: `vikass78901_db_user`
   - Password: Set a secure alphanumeric password (e.g. `VikasCricket2026`).
   - Privilege: **Read and write to any database**.
   - Click **Add User** / **Update User**.
4. **Network Access (IP Whitelist)** ⚠️ *CRITICAL*:
   - Left menu &rarr; **Network Access** &rarr; **Add IP Address**.
   - In Access List Entry, enter: **`0.0.0.0/0`** (or click **Allow Access From Anywhere**).
   - Click **Confirm**. Status will become **Active**.
5. **Get Connection String**:
   - Left menu &rarr; **Database** &rarr; Click **Connect** on your cluster.
   - Select **Drivers** (Node.js).
   - Copy connection string and format it:
     ```
     mongodb+srv://vikass78901_db_user:VikasCricket2026@cluster0.oh8z9di.mongodb.net/fantasy_cricket?retryWrites=true&w=majority
     ```

### 4.2 Migrating Local Database Data to Atlas
To copy all your existing local records (users, matches, players, squads, contests, leaderboards) to MongoDB Atlas in 1 command:

```bash
# Navigate to API directory
cd API

# Run migration script with your Atlas URL
node src/scripts/migrate.js "mongodb+srv://vikass78901_db_user:VikasCricket2026@cluster0.oh8z9di.mongodb.net/fantasy_cricket?retryWrites=true&w=majority"
```

Output:
```text
🚀 Starting database migration from Local to Atlas...
✅ Migrated 'users': 7 documents copied.
✅ Migrated 'matches': 1 documents copied.
✅ Migrated 'players': 13 documents copied.
✅ Migrated 'matchplayers': 11 documents copied.
✅ Migrated 'contests': 2 documents copied.
✅ Migrated 'fantasyteams': 5 documents copied.
✅ Migrated 'leaderboards': 8 documents copied.
🎉 ALL LOCAL DATA HAS BEEN SUCCESSFULLY COPIED TO MONGODB ATLAS!
```

---

### Common MongoDB Issues & Fixes

#### Issue 1: `The limit for free tier clusters in this project has been reached`
- **Cause**: MongoDB Atlas allows 1 free M0 cluster per project. If one already exists, the "Free" option is disabled in the starter wizard.
- **Fix**: Click `← Back` or navigate to `Project 0` to use the existing cluster, or create a `+ New Project` in Atlas to spin up a fresh free cluster.

#### Issue 2: `MongoServerError: bad auth : authentication failed`
- **Cause**: The connection URL contained the literal `<db_password>` placeholder or an incorrect user password.
- **Fix**: Replace `<db_password>` with the actual database user password without `< >` brackets. If forgotten, go to **Database Access** &rarr; **Edit** &rarr; **Edit Password** &rarr; **Update User**.

#### Issue 3: `MongooseServerSelectionError: Could not connect to any servers in your MongoDB Atlas cluster`
- **Cause**: Render's dynamic IP address is not whitelisted in Atlas.
- **Fix**: Go to **Atlas** &rarr; **Network Access** &rarr; **Add IP Address** &rarr; Add **`0.0.0.0/0`** &rarr; **Confirm**.

---

## 5. Backend Deployment on Render

### 5.1 Step-by-Step Render Configuration

1. Log in to [dashboard.render.com](https://dashboard.render.com/).
2. Click **`+ New`** (top right) &rarr; Select **`Web Service`**.
3. Select **Build and deploy from a Git repository** &rarr; Connect `Vikas-Sharma-25 / Fantasy-Cricket-Integrated`.
4. Configure fields:

| Field | Value | Reason |
| :--- | :--- | :--- |
| **Name** | `Fantasy-Cricket-API` | Unique name for the backend service |
| **Language** | `Node` | Execution runtime |
| **Branch** | `main` | Git deployment branch |
| **Region** | `Singapore (Southeast Asia)` | Lowest latency for India / Asia |
| **Root Directory** | `API` | Root folder containing backend source & package.json |
| **Build Command** | `npm install && npm run build` | Installs dependencies and compiles TypeScript (`dist/`) |
| **Start Command** | `npm start` | Runs `node dist/server.js` |
| **Instance Type** | `Free` ($0/month) | 0.1 CPU, 512 MB RAM |

### 5.2 Environment Variables Reference
In the **Environment Variables** section, click **Add from .env** and paste:

```env
NODE_ENV=production
PORT=5000
CLIENT_URL=https://fantasy-cricket-integrated-qr4b.vercel.app,http://localhost:8080
MONGO_URI=mongodb+srv://vikass78901_db_user:VikasCricket2026@cluster0.oh8z9di.mongodb.net/fantasy_cricket?retryWrites=true&w=majority
JWT_ACCESS_SECRET=fantasy_access_secret_super_secure_key_2026
JWT_REFRESH_SECRET=fantasy_refresh_secret_super_secure_key_2026
JWT_ACCESS_EXPIRES_IN=2d
JWT_REFRESH_EXPIRES_IN=7d
OTP_LENGTH=6
OTP_EXPIRES_IN_MINUTES=5
OTP_RESEND_COOLDOWN_SECONDS=30
OTP_MAX_ATTEMPTS=5
OTP_MAX_RESEND_PER_WINDOW=5
MAIL_FROM=vikass78901@gmail.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=vikass78901@gmail.com
SMTP_PASS=lwvrqtwrvxczfnvh
SMTP_SECURE=false
RATE_LIMIT_WINDOW_MINUTES=15
RATE_LIMIT_MAX=2000
```

5. Click **Deploy Web Service**.
6. Once deployed, note down your live backend URL:  
   👉 **`https://fantasy-cricket-api-ro18.onrender.com`**

---

### Common Render Build/Runtime Issues & Fixes

#### Issue 1: `tsconfig.json error TS5108 / TS5102: Option 'moduleResolution=node10' and 'baseUrl' has been removed`
- **Cause**: Render runs the latest TypeScript compiler where legacy compiler flags are deprecated.
- **Fix**: Modernized `API/tsconfig.json` to standard options:
  ```json
  {
    "compilerOptions": {
      "target": "ES2020",
      "module": "commonjs",
      "lib": ["ES2020"],
      "outDir": "dist",
      "rootDir": "src",
      "strict": true,
      "esModuleInterop": true,
      "skipLibCheck": true,
      "forceConsistentCasingInFileNames": true,
      "resolveJsonModule": true,
      "declaration": false,
      "sourceMap": true
    },
    "include": ["src/**/*.ts"],
    "exclude": ["node_modules", "dist"]
  }
  ```

#### Issue 2: `error TS7016: Could not find declaration file for module 'express' / 'bcryptjs'`
- **Cause**: When `NODE_ENV=production` is set in environment variables, `npm install` skips all packages listed under `devDependencies`. Because `@types/express` was in `devDependencies`, TypeScript failed during `tsc`.
- **Fix**: Moved all `@types/*` and `typescript` directly into `"dependencies"` in `API/package.json`.

---

## 6. Frontend Deployment on Vercel

### 6.1 Step-by-Step Vercel Configuration

1. Log in to [vercel.com](https://vercel.com/) &rarr; Click **Add New...** &rarr; **Project**.
2. Import `Vikas-Sharma-25 / Fantasy-Cricket-Integrated`.
3. Configure Project Settings:
   - **Root Directory**: Click **Edit** &rarr; Set to **`UI`** &rarr; Save.
   - **Framework Preset**: `Vite` (or `Other`).
   - **Build Command**: `NITRO_PRESET=vercel vite build` (or leave default).
4. **Environment Variables**:
   - Left menu &rarr; **Environment Variables**.
   - Add variable:
     - **Key**: `VITE_API_URL`
     - **Value**: `https://fantasy-cricket-api-ro18.onrender.com/api`
     - **Type**: **`Config`** (Public)
   - Click **Save**.
5. Click **Deploy** / **Redeploy**.
6. Your live frontend domain will be generated:  
   👉 **`https://fantasy-cricket-integrated-qr4b.vercel.app`**

---

### Common Vercel Issues & Fixes

#### Issue 1: `404: NOT_FOUND` on Page Visit
- **Cause**: Vercel was checking the monorepo root directory instead of `UI/`, and `UI/vercel.json` had a conflicting `outputDirectory: "dist"` override while TanStack Start/Nitro outputs to `.vercel/output`.
- **Fix**: Set Root Directory to `UI`, use `"build": "NITRO_PRESET=vercel vite build"` in `UI/package.json`, and clean `UI/vercel.json`.

#### Issue 2: `Environment variables with a public framework prefix cannot use 'visibility: secret'`
- **Cause**: Variables starting with `VITE_` are client-side public bundles. Vercel disallows saving them as encrypted backend secrets.
- **Fix**: Delete the old secret `VITE_API_URL` and create a new one with type **`Config`**.

---

## 7. Post-Deployment Fullstack Checklist & Maintenance

| Check Item | Status | Verified URL / Setting |
| :--- | :--- | :--- |
| **Frontend Live** | ✅ Working | `https://fantasy-cricket-integrated-qr4b.vercel.app` |
| **Backend API Live** | ✅ Working | `https://fantasy-cricket-api-ro18.onrender.com/api/health` |
| **Database Connected** | ✅ Working | MongoDB Atlas Cluster (`fantasy_cricket` DB) |
| **CORS Access** | ✅ Whitelisted | `CLIENT_URL` contains live Vercel domain |
| **6-Digit OTP Login** | ✅ Working | Instant terminal log + SMTP email dispatch |
| **Contest & Team Creation** | ✅ Working | Multi-team creation, captain selection, and contest join |

---

### 🔄 Summary of Future Git Workflow
When making future changes to the application:

```bash
# 1. Edit code locally and test
# 2. Commit and push:
git add .
git commit -m "feat: your new feature description"
git push origin main
# 3. Both Vercel and Render will auto-deploy the latest updates!
```

