import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";

async function start() {
  console.log("[smoke] starting in-memory mongo…");
  const mongod = await MongoMemoryServer.create({
    instance: { dbName: "pharma_inventory" },
  });
  const uri = mongod.getUri();
  process.env.MONGODB_URI = uri;
  process.env.JWT_SECRET = "smoke-test-secret-1234567890";
  console.log("[smoke] mongo uri:", uri);

  console.log("[smoke] importing app modules…");
  const { connectDB } = await import("../src/lib/db");
  await connectDB();
  const UserMod = await import("../src/models/User");
  const User = UserMod.User;
  const ProductMod = await import("../src/models/Product");
  const Product = ProductMod.Product;
  const SaleMod = await import("../src/models/Sale");
  const Sale = SaleMod.Sale;
  const InventoryHistoryMod = await import("../src/models/InventoryHistory");
  const InventoryHistory = InventoryHistoryMod.InventoryHistory;
  const NotificationMod = await import("../src/models/Notification");
  const Notification = NotificationMod.Notification;
  const VendorMod = await import("../src/models/Vendor");
  const Vendor = VendorMod.Vendor;
  const { hashPassword, signToken, verifyToken } = await import("../src/lib/auth");
  const { hasPermission, ROLE_HOME } = await import("../src/lib/roles");

  console.log("[smoke] creating users…");
  await User.deleteMany({});
  const adminPwd = await hashPassword("Admin@123");
  const admin = await User.create({
    name: "Admin User",
    email: "admin@pharmacare.test",
    passwordHash: adminPwd,
    role: "admin",
    status: "active",
  });
  const seller = await User.create({
    name: "Seller User",
    email: "seller@pharmacare.test",
    passwordHash: adminPwd,
    role: "seller",
    status: "active",
  });
  const vendor = await User.create({
    name: "Vendor User",
    email: "vendor@pharmacare.test",
    passwordHash: adminPwd,
    role: "vendor",
    status: "active",
  });
  const manager = await User.create({
    name: "Manager User",
    email: "manager@pharmacare.test",
    passwordHash: adminPwd,
    role: "manager",
    status: "active",
  });

  console.log("[smoke] verifying permission matrix…");
  assert(hasPermission("admin", "users:delete"), "admin should delete users");
  assert(!hasPermission("seller", "products:delete"), "seller must NOT delete products");
  assert(!hasPermission("vendor", "reports:read"), "vendor must NOT view reports");
  assert(hasPermission("manager", "products:write"), "manager should update products");
  assert(ROLE_HOME.seller === "/sales", "seller home should be /sales");
  assert(ROLE_HOME.vendor === "/inventory", "vendor home should be /inventory");
  assert(ROLE_HOME.admin === "/dashboard", "admin home should be /dashboard");
  console.log("[smoke]  ok — permission matrix correct");

  console.log("[smoke] creating vendor + product…");
  await Vendor.deleteMany({});
  await Vendor.create({
    name: "Acme Pharma",
    email: "supply@acme.test",
    phone: "+1-555-0100",
    contact: "John Vendor",
    address: "123 Supply St",
  });

  await Product.deleteMany({});
  const product = await Product.create({
    name: "Amoxicillin 500mg",
    sku: "AMX-500",
    category: "Antibiotic",
    manufacturer: "Acme Labs",
    batchNumber: "B-2024-01",
    expiryDate: new Date(Date.now() + 90 * 86400 * 1000),
    purchasePrice: 4.5,
    sellingPrice: 9.99,
    quantity: 100,
    minStockLevel: 20,
    supplier: "Acme Pharma",
    storageLocation: "A-12",
    status: "active",
  });
  console.log(`[smoke]  product created: ${product.name} qty=${product.quantity}`);

  console.log("[smoke] testing JWT…");
  const token = signToken({ uid: admin._id.toString(), role: "admin", email: admin.email, name: admin.name });
  const decoded = verifyToken(token);
  assert(decoded?.role === "admin", "JWT should round-trip admin role");
  console.log("[smoke]  ok — JWT round-trip");

  console.log("[smoke] simulating sale flow…");
  await Sale.deleteMany({});
  await InventoryHistory.deleteMany({});
  await Notification.deleteMany({});

  const qtySold = 5;
  const previousQty = product.quantity;
  product.quantity = Math.max(0, product.quantity - qtySold);
  await product.save();

  const sale = await Sale.create({
    productId: product._id,
    productName: product.name,
    sku: product.sku,
    quantity: qtySold,
    unitPrice: product.sellingPrice,
    totalAmount: qtySold * product.sellingPrice,
    soldBy: seller._id,
    soldByName: seller.name,
    note: "Walk-in customer",
  });

  await InventoryHistory.create({
    productId: product._id,
    productName: product.name,
    sku: product.sku,
    action: "sale",
    previousQty,
    changeQty: -qtySold,
    newQty: product.quantity,
    note: `Sale — ${sale.note || "walk-in"}`,
    performedBy: seller._id,
    performedByName: seller.name,
    performedByRole: "seller",
  });

  await Notification.create({
    title: "Sale recorded",
    message: `${seller.name} sold ${qtySold} × ${product.name}.`,
    type: "sale",
    level: "success",
    targetRoles: ["admin", "manager"],
    meta: { productId: String(product._id), quantity: qtySold, totalAmount: sale.totalAmount },
  });

  const reloaded = await Product.findById(product._id);
  assert(reloaded!.quantity === 95, `expected 95, got ${reloaded!.quantity}`);
  const notifs = await Notification.find({ type: "sale" });
  assert(notifs.length === 1, "admin/manager should have 1 sale notification");
  const historyCount = await InventoryHistory.countDocuments({ action: "sale" });
  assert(historyCount === 1, "should have 1 sale history record");
  console.log("[smoke]  ok — sale reduced stock, logged history, notified admin");

  console.log("[smoke] testing product pre-save status…");
  const p2 = await Product.create({
    name: "Old Medicine",
    sku: "OLD-001",
    category: "Antiseptic",
    manufacturer: "X",
    batchNumber: "X-1",
    expiryDate: new Date(Date.now() - 5 * 86400 * 1000),
    purchasePrice: 1,
    sellingPrice: 2,
    quantity: 100,
    minStockLevel: 10,
    supplier: "X",
    storageLocation: "Z",
  });
  assert(p2.status === "expired", `expected expired, got ${p2.status}`);

  const p3 = await Product.create({
    name: "Low Med",
    sku: "LOW-001",
    category: "Vitamin",
    manufacturer: "X",
    batchNumber: "X-2",
    expiryDate: new Date(Date.now() + 365 * 86400 * 1000),
    purchasePrice: 1,
    sellingPrice: 2,
    quantity: 5,
    minStockLevel: 10,
    supplier: "X",
    storageLocation: "Z",
  });
  assert(p3.status === "low_stock", `expected low_stock, got ${p3.status}`);
  console.log("[smoke]  ok — status auto-computed (expired, low_stock)");

  console.log("[smoke] testing unique email…");
  let dupErr = "";
  try {
    await User.create({
      name: "dup",
      email: "admin@pharmacare.test",
      passwordHash: adminPwd,
      role: "admin",
      status: "active",
    });
  } catch (e: any) {
    dupErr = e.message;
  }
  assert(dupErr.length > 0, "duplicate email should be rejected");
  console.log("[smoke]  ok — duplicate email rejected");

  console.log("[smoke] testing inventory adjustment (vendor restock)…");
  await Notification.deleteMany({});
  await InventoryHistory.deleteMany({ action: "adjustment" });
  const restockQty = 50;
  const before = product.quantity;
  product.quantity += restockQty;
  await product.save();
  await InventoryHistory.create({
    productId: product._id,
    productName: product.name,
    sku: product.sku,
    action: "adjustment",
    previousQty: before,
    changeQty: restockQty,
    newQty: product.quantity,
    note: "Vendor restock",
    performedBy: vendor._id,
    performedByName: vendor.name,
    performedByRole: "vendor",
  });
  await Notification.create({
    title: "Stock adjusted",
    message: `${vendor.name} added ${restockQty} units of ${product.name}.`,
    type: "inventory",
    level: "info",
    targetRoles: ["admin", "manager"],
    meta: { productId: String(product._id) },
  });
  const after = await Product.findById(product._id);
  assert(after!.quantity === before + restockQty, `expected ${before + restockQty}, got ${after!.quantity}`);
  const adjHistory = await InventoryHistory.countDocuments({ action: "adjustment" });
  assert(adjHistory === 1, "should have 1 adjustment record");
  console.log("[smoke]  ok — vendor restock updated stock and notified admins");

  console.log("\n[smoke] ALL CHECKS PASSED ✅");
  await mongoose.disconnect();
  await mongod.stop();
  process.exit(0);
}

function assert(cond: unknown, msg: string) {
  if (!cond) {
    console.error("[smoke] FAIL:", msg);
    process.exit(1);
  }
}

start().catch((e) => {
  console.error("[smoke] crashed:", e);
  process.exit(1);
});
