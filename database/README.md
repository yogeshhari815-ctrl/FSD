# Database

This folder runs MongoDB locally with Docker Compose. The API connects to `mongodb://127.0.0.1:27017/vendor_management`. On the first start, MongoDB imports the sample suppliers and purchase orders from `init-mongo.js`.

## Start and inspect

```powershell
docker compose up -d
docker compose ps
docker compose logs -f mongodb
```

Open a Mongo shell:

```powershell
docker compose exec mongodb mongosh vendor_management
```

In `mongosh`, inspect records with `db.suppliers.find()` and `db.purchaseorders.find()`.

Stop MongoDB and keep its data:

```powershell
docker compose down
```

To reset the database and rerun the sample-data initializer, remove the local Docker volume with `docker compose down -v` and start it again. This deletes the database contents.

The API's Mongoose schemas and indexes are in `../backend/src/models/`.