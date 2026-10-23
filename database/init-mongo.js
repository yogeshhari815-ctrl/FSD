db = db.getSiblingDB("vendor_management");

if (db.suppliers.countDocuments() === 0) {
  const suppliers = db.suppliers.insertMany([
    {
      name: "Northstar Industrial",
      category: "Manufacturing",
      contactName: "Olivia Chen",
      email: "olivia@northstar.example",
      phone: "+1 415 555 0132",
      location: "Portland, OR",
      status: "Active",
      rating: 4.8,
      spend: 184500,
      deliveryRate: 98,
      qualityScore: 96,
      compliance: "Compliant",
      joinedAt: ISODate("2024-02-12T00:00:00Z")
    },
    {
      name: "Verde Office Co.",
      category: "Office supplies",
      contactName: "Marcus Lee",
      email: "marcus@verde.example",
      phone: "+1 206 555 0184",
      location: "Seattle, WA",
      status: "Active",
      rating: 4.5,
      spend: 72600,
      deliveryRate: 94,
      qualityScore: 91,
      compliance: "Compliant",
      joinedAt: ISODate("2024-05-03T00:00:00Z")
    },
    {
      name: "Apex Cloud Systems",
      category: "Technology",
      contactName: "Priya Nair",
      email: "priya@apexcloud.example",
      phone: "+1 512 555 0157",
      location: "Austin, TX",
      status: "Under review",
      rating: 4.1,
      spend: 129800,
      deliveryRate: 89,
      qualityScore: 93,
      compliance: "Review",
      joinedAt: ISODate("2025-01-19T00:00:00Z")
    },
    {
      name: "Clearwater Logistics",
      category: "Logistics",
      contactName: "James Okafor",
      email: "james@clearwater.example",
      phone: "+1 312 555 0116",
      location: "Chicago, IL",
      status: "Pending",
      rating: 0,
      spend: 0,
      deliveryRate: 0,
      qualityScore: 0,
      compliance: "Missing",
      joinedAt: ISODate("2025-06-08T00:00:00Z")
    },
    {
      name: "Meridian Packaging",
      category: "Packaging",
      contactName: "Sofia Rivera",
      email: "sofia@meridian.example",
      phone: "+1 303 555 0168",
      location: "Denver, CO",
      status: "At risk",
      rating: 3.7,
      spend: 54800,
      deliveryRate: 76,
      qualityScore: 82,
      compliance: "Review",
      joinedAt: ISODate("2023-11-24T00:00:00Z")
    }
  ]);

  const northstar = suppliers.insertedIds[0];
  const verde = suppliers.insertedIds[1];
  const apex = suppliers.insertedIds[2];

  db.purchaseorders.insertMany([
    { orderNumber: "PO-10482", supplier: northstar, title: "Precision components, Q4", amount: 24800, status: "In transit", placedAt: ISODate("2026-10-12T00:00:00Z"), dueDate: ISODate("2026-10-27T00:00:00Z") },
    { orderNumber: "PO-10481", supplier: verde, title: "Workspace refresh", amount: 6350, status: "Approved", placedAt: ISODate("2026-10-11T00:00:00Z"), dueDate: ISODate("2026-11-02T00:00:00Z") },
    { orderNumber: "PO-10480", supplier: apex, title: "Cloud infrastructure renewal", amount: 41200, status: "Submitted", placedAt: ISODate("2026-10-10T00:00:00Z"), dueDate: ISODate("2026-11-10T00:00:00Z") },
    { orderNumber: "PO-10479", supplier: northstar, title: "Assembly line tooling", amount: 18750, status: "Delivered", placedAt: ISODate("2026-10-02T00:00:00Z"), dueDate: ISODate("2026-10-16T00:00:00Z") }
  ]);
}