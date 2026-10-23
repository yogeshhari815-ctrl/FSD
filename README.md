# Vendor Management System

A MERN procurement portal for supplier onboarding and review, vendor performance tracking, and purchase-order lifecycle management.

## Project folders

- `frontend/` - React + Vite procurement dashboard.
- `backend/` - Express REST API and Mongoose models. 
- `database/` - MongoDB Docker setup, sample records, and database instructions.

## Run locally

Prerequisites: Node.js 20.19+ and npm. Start MongoDB with Docker Desktop, or use a MongoDB Atlas connection string.

1. Start the database in one terminal:

   ```powershell
   cd "database"
   docker compose up -d
   ```

2. Start the backend in a second terminal:

   ```powershell
   cd "backend"
   Copy-Item .env.example .env
   npm.cmd install
   npm.cmd run dev
   ```

3. Start the frontend in a third terminal:

   ```powershell
   cd "frontend"
   npm.cmd install
   npm.cmd run dev
   ```

Open http://localhost:5173. The API is at http://localhost:5000/api and its health check is http://localhost:5000/api/health.

PowerShell may block the `npm` PowerShell script on some machines; use `npm.cmd` as shown. In Command Prompt or a Unix shell, use `npm`.

For the Atlas option, set `MONGODB_URI` in `backend/.env` to your Atlas connection string instead of the local URI. Details and folder-specific commands are in each folder's README.
