# Academic Print Manager

A full-stack web application for managing academic experiment PDFs. Students upload lab reports, admins manage the curriculum structure, and the system tracks print history with deadline reminders.

## Tech Stack

| Layer | Technology |
|:---|:---|
| Frontend | React 19, Vite, React Router 7 |
| Backend | Node.js, Express 5 |
| Database | MongoDB Atlas (Mongoose) |
| File Storage | Google Drive (OAuth 2.0) |
| Push Notifications | Firebase Cloud Messaging (FCM) |
| Auth | JWT + bcrypt |

---

## Project Structure

```
academic-print-manager/
├── client/          # React frontend (deploy to Vercel)
└── server/          # Express backend  (deploy to Render)
```

---

## Local Development

### Prerequisites
- Node.js 18+
- A MongoDB Atlas cluster
- Google Cloud OAuth 2.0 credentials (Drive API enabled)
- Firebase project with FCM enabled

### 1. Clone the repo

```bash
git clone https://github.com/YOUR_USERNAME/academic-print-manager.git
cd academic-print-manager
```

### 2. Configure the server

```bash
cd server
cp .env.example .env
```

Fill in `server/.env`:

```env
PORT=5000
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/academic_print_manager
JWT_SECRET=a-long-random-secret
CLIENT_URL=http://localhost:5173

# Google Drive OAuth 2.0
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:5001/oauth2callback
GOOGLE_REFRESH_TOKEN=
GOOGLE_DRIVE_FOLDER_ID=

# Firebase Admin SDK — paste the entire service account JSON as ONE line
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"..."}

# Used only when running: node scripts/seedAdmin.js
ADMIN_NAME=Admin
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=your-strong-password
```

### 3. Seed the admin account

```bash
cd server
node scripts/seedAdmin.js
```

### 4. Start the servers

```bash
# Terminal 1 — backend
cd server && npm run dev

# Terminal 2 — frontend
cd client && npm run dev
```

Frontend runs on http://localhost:5173  
Backend runs on http://localhost:5000

---

## Deployment

### Backend → Render

1. Go to [render.com](https://render.com) → **New Web Service**
2. Connect your GitHub repo, set **Root Directory** to `server`
3. Build command: `npm install`  
   Start command: `npm start`
4. Add every environment variable from the table below in **Environment → Secret Files / Env Vars**
5. The `server/render.yaml` file pre-fills the service config — Render will detect it automatically

### Frontend → Vercel

1. Go to [vercel.com](https://vercel.com) → **New Project** → import your repo
2. Set **Root Directory** to `client`
3. Framework preset: **Vite**
4. Add the single environment variable below
5. Deploy — `vercel.json` handles React Router's client-side routing automatically

### Environment Variables Reference

#### Server (Render)

| Variable | Description |
|:---|:---|
| `NODE_ENV` | Set to `production` |
| `PORT` | `10000` (Render default) |
| `MONGODB_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | Long random string for signing tokens |
| `CLIENT_URL` | Your Vercel frontend URL e.g. `https://academic-print-manager.vercel.app` |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `GOOGLE_REDIRECT_URI` | OAuth redirect URI (can keep localhost value) |
| `GOOGLE_REFRESH_TOKEN` | OAuth refresh token |
| `GOOGLE_DRIVE_FOLDER_ID` | Google Drive folder ID for uploads |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Entire Firebase Admin SDK JSON as a single-line string |

#### Client (Vercel)

| Variable | Description |
|:---|:---|
| `VITE_API_URL` | Your Render backend URL e.g. `https://academic-print-manager-api.onrender.com/api` |

> **How to get `FIREBASE_SERVICE_ACCOUNT_JSON`:**  
> Open the `.json` file from Firebase Console → Service Accounts, minify it to one line (e.g. `jq -c . serviceaccount.json`), then paste the entire string as the env var value.

---

## Utility Scripts

Run these from the `server/` directory:

| Script | Purpose |
|:---|:---|
| `node scripts/seedAdmin.js` | Create the first admin account |
| `node scripts/resetData.js` | Wipe all data except admin accounts (fresh start) |
| `node scripts/resetAdmin.js` | Reset admin password |

---

## Features

- **Admin**: Manage semesters, subjects, experiments, and student accounts
- **Students**: Browse experiments, upload PDFs (drag & drop, 20 MB limit)
- **PDF Viewer**: In-browser viewer with print logging
- **Google Drive**: All PDFs stored and streamed securely from Drive
- **Print History**: Full log with page counts and totals
- **Statistics**: Usage analytics for both students and admins
- **Deadline Reminders**: Set deadlines on uploads; get FCM push notification 1 day before if not printed
- **Settings**: Profile, password, and notification preferences for all users
