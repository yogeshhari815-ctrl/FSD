import "dotenv/config";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import suppliersRouter from "./routes/suppliers.js";
import ordersRouter from "./routes/orders.js";

const app = express();
const port = process.env.PORT || 5000;

app.use(cors({ origin: process.env.CLIENT_ORIGIN || "http://localhost:5173" }));
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", database: mongoose.connection.readyState === 1 ? "connected" : "disconnected" });
});
app.use("/api/suppliers", suppliersRouter);
app.use("/api/orders", ordersRouter);
app.use((req, res) => res.status(404).json({ message: `Route not found: ${req.method} ${req.path}` }));
app.use((error, _req, res, _next) => {
  if (error.code === 11000) return res.status(409).json({ message: "A record with that value already exists" });
  if (error.name === "ValidationError" || error.name === "CastError") {
    return res.status(400).json({ message: error.message });
  }
  console.error(error);
  res.status(500).json({ message: "Unexpected server error" });
});

try {
  await mongoose.connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/vendor_management");
  app.listen(port, () => console.log(`Vendor Management API listening on http://localhost:${port}`));
} catch (error) {
  console.error("Could not connect to MongoDB:", error.message);
  process.exit(1);
}