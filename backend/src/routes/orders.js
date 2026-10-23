import { Router } from "express";
import PurchaseOrder from "../models/PurchaseOrder.js";
import Supplier from "../models/Supplier.js";

const router = Router();
const populateSupplier = { path: "supplier", select: "name category" };
const allowedTransitions = {
  Draft: ["Submitted", "Cancelled"],
  Submitted: ["Approved", "Cancelled"],
  Approved: ["In transit", "Cancelled"],
  "In transit": ["Delivered", "Cancelled"],
  Delivered: [],
  Cancelled: []
};

router.get("/", async (req, res) => {
  const query = {};
  if (req.query.status && req.query.status !== "All") query.status = req.query.status;
  if (req.query.search) {
    const search = String(req.query.search).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    query.$or = [
      { orderNumber: new RegExp(search, "i") },
      { title: new RegExp(search, "i") }
    ];
  }
  res.json(await PurchaseOrder.find(query).populate(populateSupplier).sort({ placedAt: -1 }));
});

router.post("/", async (req, res) => {
  const supplier = await Supplier.findById(req.body.supplier);
  if (!supplier) return res.status(400).json({ message: "Choose a valid supplier" });
  const order = await PurchaseOrder.create({
    ...req.body,
    orderNumber: `PO-${Date.now()}`,
    status: "Submitted"
  });
  await order.populate(populateSupplier);
  res.status(201).json(order);
});

router.get("/:id", async (req, res) => {
  const order = await PurchaseOrder.findById(req.params.id).populate(populateSupplier);
  if (!order) return res.status(404).json({ message: "Purchase order not found" });
  res.json(order);
});

router.patch("/:id", async (req, res) => {
  const order = await PurchaseOrder.findById(req.params.id);
  if (!order) return res.status(404).json({ message: "Purchase order not found" });
  if (req.body.status && req.body.status !== order.status && !allowedTransitions[order.status].includes(req.body.status)) {
    return res.status(409).json({ message: `Cannot move an order from ${order.status} to ${req.body.status}` });
  }
  order.set(req.body);
  await order.save();
  await order.populate(populateSupplier);
  res.json(order);
});

router.delete("/:id", async (req, res) => {
  const order = await PurchaseOrder.findByIdAndDelete(req.params.id);
  if (!order) return res.status(404).json({ message: "Purchase order not found" });
  res.status(204).end();
});

export default router;