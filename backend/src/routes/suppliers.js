import { Router } from "express";
import Supplier from "../models/Supplier.js";
import PurchaseOrder from "../models/PurchaseOrder.js";

const router = Router();

router.get("/", async (req, res) => {
  const query = {};
  if (req.query.status && req.query.status !== "All") query.status = req.query.status;
  if (req.query.search) {
    const term = new RegExp(String(req.query.search).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    query.$or = [{ name: term }, { category: term }, { contactName: term }, { email: term }];
  }
  res.json(await Supplier.find(query).sort({ updatedAt: -1 }));
});

router.post("/", async (req, res) => {
  const supplier = await Supplier.create(req.body);
  res.status(201).json(supplier);
});

router.get("/:id", async (req, res) => {
  const supplier = await Supplier.findById(req.params.id);
  if (!supplier) return res.status(404).json({ message: "Supplier not found" });
  res.json(supplier);
});

router.patch("/:id", async (req, res) => {
  const supplier = await Supplier.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });
  if (!supplier) return res.status(404).json({ message: "Supplier not found" });
  res.json(supplier);
});

router.delete("/:id", async (req, res) => {
  const hasOrders = await PurchaseOrder.exists({ supplier: req.params.id });
  if (hasOrders) return res.status(409).json({ message: "Cannot remove a supplier with purchase orders" });
  const supplier = await Supplier.findByIdAndDelete(req.params.id);
  if (!supplier) return res.status(404).json({ message: "Supplier not found" });
  res.status(204).end();
});

export default router;