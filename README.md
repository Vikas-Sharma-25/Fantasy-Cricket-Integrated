# Fantasy Cricket — Integrated UI + API

This project contains the React/Vite frontend and the Node/Express/TypeScript API wired together for local browser development.

## Project structure

- `UI/` — React + Vite frontend
- `API/` — Express + TypeScript backend

## 1. Start MongoDB

The API defaults to:

`mongodb://127.0.0.1:27017/fantasy_cricket`

Change `API/.env` if your MongoDB connection is different.

## 2. Configure the API

Copy `API/.env.example` to `API/.env`.

Minimum development values:

- `PORT=5000`
- `CLIENT_URL=http://localhost:5173`
- `MONGO_URI=mongodb://127.0.0.1:27017/fantasy_cricket`
- Set your own JWT secrets.

For email OTP, configure `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` and `MAIL_FROM`. If SMTP is not configured, the existing backend mailer can use its development fallback/logging behavior.

## 3. Configure the UI

Copy `UI/.env.example` to `UI/.env`.

`VITE_API_URL=http://localhost:5000/api`

## 4. Install dependencies

Terminal 1:

```bash
cd API
npm install
npm run dev
```

Terminal 2:

```bash
cd UI
npm install
npm run dev
```

Open the Vite URL shown by the terminal, normally `http://localhost:5173`.

## Browser flow

Registration:

`React Register → POST /api/auth/register → OTP cookie → Verify OTP → POST /api/auth/verify-account`

Login:

`React Login → POST /api/auth/login → OTP cookie → Verify OTP → POST /api/auth/verify-otp → accessToken`

Fantasy flow:

`Matches → Match Details → Players → Create Team → Captain/VC → POST /api/teams → Contests → POST /api/contests/:contestId/join → Leaderboard`

The frontend sends the JWT as a Bearer token for protected API calls and includes cookies for the API's OTP and refresh-token sessions.
