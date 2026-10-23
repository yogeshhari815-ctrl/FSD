# Backend

Express API with Mongoose models for suppliers and purchase orders.

## Run

Start MongoDB from `../database`, then:

```powershell
Copy-Item .env.example .env
npm.cmd install
npm.cmd run dev
```

The server listens on port 5000 by default. Set `MONGODB_URI`, `PORT`, or `CLIENT_ORIGIN` in `.env` to change local settings.

## API

- `GET /api/health` - server and database status.
- `GET|POST /api/suppliers` - list and onboard suppliers.
- `GET|PATCH|DELETE /api/suppliers/:id` - inspect, update, or remove a supplier.
- `GET|POST /api/orders` - list and create purchase orders.
- `GET|PATCH|DELETE /api/orders/:id` - inspect, advance, or remove a purchase order.

Supplier list filters: `search` and `status`. Order list filters: `search` and `status`.