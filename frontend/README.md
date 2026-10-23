# Frontend

React 19 + Vite dashboard for supplier onboarding, performance scorecards, and purchase order tracking.

## Run

Start the database and backend first (see the root README), then:

```powershell
npm.cmd install
npm.cmd run dev
```

Open the local URL printed by Vite, usually http://localhost:5173. The API defaults to `http://localhost:5000/api`; copy `.env.example` to `.env` to configure `VITE_API_URL`.

Create a production bundle with `npm.cmd run build`.