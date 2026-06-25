/**
 * Seed script for PharmaCare. Run with:
 *   MONGODB_URI=... node --experimental-strip-types scripts/seed.ts
 * or after compile:
 *   MONGODB_URI=... npx tsx scripts/seed.ts
 *
 * Loads a few realistic pharma products, a user for each role, vendors,
 * notifications, and a couple of inventory history entries so the UI has
 * meaningful data on first run.
 */
import "dotenv/config";
import mongoose from "mongoose";
import { User } from "../src/models/User";
import { Product } from "../src/models/Product";
import { InventoryHistory } from "../src/models/InventoryHistory";
import { Sale } from "../src/models/Sale";
import { Vendor } from "../src/models/Vendor";
import { Notification } from "../src/models/Notification";
import { hashPassword } from "../src/lib/auth";

const MONGODB_URI = process.env.MONGODB_URI || "";

if (!MONGODB_URI) {
  console.error("Please set MONGODB_URI before seeding.");
  process.exit(1);
}

async function run() {
  await mongoose.connect(MONGODB_URI, { dbName: "pharma_inventory" });
  console.log("Connected.");

  await Promise.all([
    User.deleteMany({}), Product.deleteMany({}),
    InventoryHistory.deleteMany({}), Sale.deleteMany({}),
    Vendor.deleteMany({}), Notification.deleteMany({})
  ]);

  const password = await hashPassword("Demo@123");
  const admin = await User.create({ name: "Alice Admin", email: "admin@pharmacare.test", passwordHash: password, role: "admin", phone: "+1 555 010 0001", status: "active" });
  const manager = await User.create({ name: "Mark Manager", email: "manager@pharmacare.test", passwordHash: password, role: "manager", phone: "+1 555 010 0002", status: "active" });
  const seller = await User.create({ name: "Sara Seller", email: "seller@pharmacare.test", passwordHash: password, role: "seller", phone: "+1 555 010 0003", status: "active" });
  const seller2 = await User.create({ name: "Sam Seller", email: "seller2@pharmacare.test", passwordHash: password, role: "seller", phone: "+1 555 010 0004", status: "active" });
  const vendor = await User.create({ name: "Vera Vendor", email: "vendor@pharmacare.test", passwordHash: password, role: "vendor", phone: "+1 555 010 0005", status: "active" });

  console.log("Users seeded");

  const vendorCompanies = await Vendor.insertMany([
    { name: "MediSource Distributors", contactPerson: "Vera Vendor", email: "vendor@pharmacare.test", phone: "+1 555 010 0005", gstNumber: "GST12345" },
    { name: "HealthPlus Logistics", contactPerson: "Henry Health", email: "ops@healthplus.test", phone: "+1 555 010 0100", gstNumber: "GST67890" }
  ]);

  const days = (n: number) => new Date(Date.now() + n * 24 * 60 * 60 * 1000);

  const products = [
    { name: "Paracetamol 500mg", sku: "PCM-500-01", category: "Tablet", manufacturer: "Cipla", batchNumber: "B-2401", expiryDate: days(120), purchasePrice: 0.6, sellingPrice: 1.5, quantity: 320, minStockLevel: 50, supplier: vendorCompanies[0].name },
    { name: "Amoxicillin 250mg", sku: "AMX-250-01", category: "Capsule", manufacturer: "Sun Pharma", batchNumber: "B-2402", expiryDate: days(20), purchasePrice: 1.8, sellingPrice: 3.5, quantity: 18, minStockLevel: 30, supplier: vendorCompanies[0].name },
    { name: "Cetirizine 10mg", sku: "CTZ-10-01", category: "Tablet", manufacturer: "Dr. Reddy's", batchNumber: "B-2403", expiryDate: days(200), purchasePrice: 0.4, sellingPrice: 0.9, quantity: 250, minStockLevel: 60, supplier: vendorCompanies[0].name },
    { name: "Cough Syrup 100ml", sku: "CGH-100-01", category: "Syrup", manufacturer: "Dabur", batchNumber: "B-2404", expiryDate: days(-5), purchasePrice: 2.2, sellingPrice: 4.5, quantity: 12, minStockLevel: 25, supplier: vendorCompanies[1].name },
    { name: "Insulin Glargine Pen", sku: "INS-PEN-01", category: "Injection", manufacturer: "Sanofi", batchNumber: "B-2405", expiryDate: days(45), purchasePrice: 28, sellingPrice: 42, quantity: 6, minStockLevel: 10, supplier: vendorCompanies[1].name },
    { name: "Vitamin D3 60K", sku: "VTD3-60K-01", category: "Tablet", manufacturer: "Mankind", batchNumber: "B-2406", expiryDate: days(365), purchasePrice: 1.5, sellingPrice: 3.2, quantity: 90, minStockLevel: 30, supplier: vendorCompanies[0].name },
    { name: "ORS Powder 21g", sku: "ORS-21-01", category: "Sachet", manufacturer: "FDC", batchNumber: "B-2407", expiryDate: days(540), purchasePrice: 0.2, sellingPrice: 0.6, quantity: 540, minStockLevel: 100, supplier: vendorCompanies[1].name },
    { name: "Aspirin 75mg", sku: "ASP-75-01", category: "Tablet", manufacturer: "Bayer", batchNumber: "B-2408", expiryDate: days(8), purchasePrice: 0.35, sellingPrice: 0.8, quantity: 22, minStockLevel: 40, supplier: vendorCompanies[0].name },
    { name: "Salbutamol Inhaler", sku: "SLB-INH-01", category: "Inhaler", manufacturer: "Cipla", batchNumber: "B-2409", expiryDate: days(180), purchasePrice: 4.5, sellingPrice: 7.5, quantity: 32, minStockLevel: 15, supplier: vendorCompanies[0].name },
    { name: "Paracetamol Syrup 60ml", sku: "PCM-SYR-01", category: "Syrup", manufacturer: "Cipla", batchNumber: "B-2410", expiryDate: days(95), purchasePrice: 1.0, sellingPrice: 2.5, quantity: 60, minStockLevel: 20, supplier: vendorCompanies[1].name }
  ];

  const productDocs = await Product.insertMany(products.map((p) => ({ ...p, vendorId: vendor._id })));
  console.log(`Products seeded (${productDocs.length})`);

  for (const p of productDocs) {
    await InventoryHistory.create({
      productId: p._id, productName: p.name, sku: p.sku,
      action: "create", previousQty: 0, changeQty: p.quantity, newQty: p.quantity,
      note: "Seeded product", performedBy: admin._id, performedByName: admin.name, performedByRole: admin.role
    });
  }

  const sales = [
    { p: productDocs[0], qty: 5, by: seller },
    { p: productDocs[2], qty: 12, by: seller2 },
    { p: productDocs[5], qty: 3, by: seller },
    { p: productDocs[6], qty: 25, by: seller2 },
    { p: productDocs[8], qty: 2, by: seller }
  ];
  for (const s of sales) {
    const prev = s.p.quantity;
    s.p.quantity = Math.max(0, prev - s.qty);
    await s.p.save();
    await Sale.create({
      productId: s.p._id, productName: s.p.name, sku: s.p.sku,
      quantity: s.qty, unitPrice: s.p.sellingPrice, totalAmount: s.qty * s.p.sellingPrice,
      customerName: "Walk-in", paymentMethod: "cash", soldBy: s.by._id, soldByName: s.by.name
    });
    await InventoryHistory.create({
      productId: s.p._id, productName: s.p.name, sku: s.p.sku,
      action: "sale", previousQty: prev, changeQty: -s.qty, newQty: s.p.quantity,
      note: "Sale to Walk-in customer",
      performedBy: s.by._id, performedByName: s.by.name, performedByRole: s.by.role
    });
  }

  await Notification.insertMany([
    { title: "Welcome to PharmaCare", message: "Your demo workspace is ready. Try logging in as different roles.", type: "system", level: "info", targetRoles: ["admin", "manager", "seller", "vendor"] },
    { title: "Low stock alert", message: `${productDocs[1].name} is low on stock (${productDocs[1].quantity} left).`, type: "low_stock", level: "warning", targetRoles: ["admin", "manager"] },
    { title: "Expired medicine detected", message: `${productDocs[3].name} has expired. Remove from active inventory.`, type: "expired", level: "error", targetRoles: ["admin", "manager"] },
    { title: "New product added", message: `Paracetamol 500mg (${productDocs[0].sku}) added with ${productDocs[0].quantity} units.`, type: "new_product", level: "success", targetRoles: ["admin", "manager"] }
  ]);

  console.log("Seed complete.");
  console.log("Login credentials (password: Demo@123):");
  console.log("  admin@pharmacare.test");
  console.log("  manager@pharmacare.test");
  console.log("  seller@pharmacare.test");
  console.log("  vendor@pharmacare.test");

  await mongoose.disconnect();
}

run().catch((e) => { console.error(e); process.exit(1); });
