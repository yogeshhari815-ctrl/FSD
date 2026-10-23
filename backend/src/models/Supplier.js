import mongoose from "mongoose";

const supplierSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  category: { type: String, required: true, trim: true },
  contactName: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, lowercase: true },
  phone: { type: String, default: "" },
  location: { type: String, default: "" },
  status: {
    type: String,
    enum: ["Pending", "Active", "Under review", "At risk"],
    default: "Pending"
  },
  rating: { type: Number, min: 0, max: 5, default: 0 },
  spend: { type: Number, min: 0, default: 0 },
  deliveryRate: { type: Number, min: 0, max: 100, default: 0 },
  qualityScore: { type: Number, min: 0, max: 100, default: 0 },
  compliance: { type: String, enum: ["Compliant", "Review", "Missing"], default: "Missing" },
  joinedAt: { type: Date, default: Date.now }
}, { timestamps: true });

supplierSchema.index({ email: 1 }, { unique: true });

export default mongoose.model("Supplier", supplierSchema);