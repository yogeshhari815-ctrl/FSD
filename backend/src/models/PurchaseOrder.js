import mongoose from "mongoose";

const purchaseOrderSchema = new mongoose.Schema({
  orderNumber: { type: String, required: true, unique: true },
  supplier: { type: mongoose.Schema.Types.ObjectId, ref: "Supplier", required: true },
  title: { type: String, required: true, trim: true },
  amount: { type: Number, required: true, min: 0 },
  status: {
    type: String,
    enum: ["Draft", "Submitted", "Approved", "In transit", "Delivered", "Cancelled"],
    default: "Draft"
  },
  placedAt: { type: Date, default: Date.now },
  dueDate: { type: Date, required: true }
}, { timestamps: true });

purchaseOrderSchema.index({ status: 1, placedAt: -1 });

export default mongoose.model("PurchaseOrder", purchaseOrderSchema);