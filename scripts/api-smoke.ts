import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import { spawn } from "child_process";
import fs from "fs";
import path from "path";

const BASE = "http://localhost:3050";

async function waitForServer(max = 60) {
  for (let i = 0; i < max; i++) {
    try {
      const r = await fetch(BASE + "/api/auth/me");
      if (r.status < 500) return true;
    } catch {}
    await new Promise((r) => setTimeout(r, 1000));
  }
  return false;
}

async function start() {
  console.log("[api-smoke] starting in-memory mongo…");
  const mongod = await MongoMemoryServer.create({
    instance: { dbName: "pharma_inventory" },
  });
  const uri = mongod.getUri();
  process.env.MONGODB_URI = uri;
  process.env.JWT_SECRET = "api-smoke-secret-1234567890";
  console.log("[api-smoke] mongo:", uri);

  // Seed data BEFORE launching the Next server so the seeded cookie user exists
  console.log("[api-smoke] seeding data…");
  const { connectDB } = await import("../src/lib/db");
  await connectDB();
  const { User } = await import("../src/models/User");
  const { Product } = await import("../src/models/Product");
  const { hashPassword } = await import("../src/lib/auth");
  const pwd = await hashPassword("Demo@123");
  await User.deleteMany({});
  await Product.deleteMany({});
  await User.create({
    name: "Alice Admin",
    email: "admin@pharmacare.test",
    passwordHash: pwd,
    role: "admin",
    status: "active",
  });
  await User.create({
    name: "Sara Seller",
    email: "seller@pharmacare.test",
    passwordHash: pwd,
    role: "seller",
    status: "active",
  });
  const product = await Product.create({
    name: "Paracetamol 500mg",
    sku: "PAR-500",
    category: "Analgesic",
    manufacturer: "Acme",
    batchNumber: "B-1",
    expiryDate: new Date(Date.now() + 60 * 86400 * 1000),
    purchasePrice: 2,
    sellingPrice: 5,
    quantity: 50,
    minStockLevel: 10,
    supplier: "Acme",
    storageLocation: "A-1",
  });
  console.log(`[api-smoke] seeded: admin/seller users + product ${product.name} (qty=${product.quantity})`);
  await mongoose.disconnect();

  // Copy .env.local with the in-memory URI
  const envPath = path.join(process.cwd(), ".env.api-smoke");
  fs.writeFileSync(envPath, `MONGODB_URI=${uri}\nJWT_SECRET=${process.env.JWT_SECRET}\nNODE_ENV=development\nPORT=3050\n`);

  console.log("[api-smoke] launching Next.js on :3050…");
  const child = spawn(
    "node",
    ["./node_modules/next/dist/bin/next", "start", "-p", "3050"],
    {
      cwd: process.cwd(),
      env: { ...process.env, MONGODB_URI: uri, JWT_SECRET: process.env.JWT_SECRET },
      stdio: ["ignore", "pipe", "pipe"],
    }
  );
  child.stdout.on("data", (b) => process.stdout.write("[next] " + b.toString()));
  child.stderr.on("data", (b) => process.stderr.write("[next] " + b.toString()));

  const up = await waitForServer();
  if (!up) {
    console.error("[api-smoke] server failed to start");
    child.kill();
    await mongod.stop();
    process.exit(1);
  }
  console.log("[api-smoke] server is up");

  let cookie = "";
  try {
    // 1. /api/auth/me should return null user when unauthenticated (the contract used by the app)
    {
      const r = await fetch(BASE + "/api/auth/me");
      assertEq(r.status, 200, "unauthenticated /me returns 200 with null user");
      const data = await r.json();
      assertEq(data.user, null, "unauthenticated /me user is null");
      console.log("[api-smoke]  ok — /me returns null when unauthenticated");
    }

    // 2. login as admin
    {
      const r = await fetch(BASE + "/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "admin@pharmacare.test", password: "Demo@123" }),
      });
      assertEq(r.status, 200, "admin login");
      const setCookie = r.headers.get("set-cookie") || "";
      cookie = setCookie.split(";")[0];
      const data = await r.json();
      assertEq(data.user.role, "admin", "login returns admin role");
      assert(cookie.startsWith("pharma_token="), "auth cookie set");
      console.log("[api-smoke]  ok — admin login + cookie issued");
    }

    // 3. /api/auth/me with cookie
    {
      const r = await fetch(BASE + "/api/auth/me", { headers: { cookie } });
      assertEq(r.status, 200, "authed /me");
      const data = await r.json();
      assertEq(data.user.email, "admin@pharmacare.test", "/me returns admin email");
      console.log("[api-smoke]  ok — /me returns admin user");
    }

    // 4. bad login
    {
      const r = await fetch(BASE + "/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "admin@pharmacare.test", password: "WRONG" }),
      });
      assertEq(r.status, 401, "bad password rejected");
      console.log("[api-smoke]  ok — bad password rejected");
    }

    // 5. list products
    {
      const r = await fetch(BASE + "/api/products", { headers: { cookie } });
      assertEq(r.status, 200, "GET /products");
      const data = await r.json();
      const list = data.products || data.items || [];
      assertEq(list.length, 1, "1 product");
      assertEq(list[0].sku, "PAR-500", "product sku");
      console.log("[api-smoke]  ok — list products");
    }

    // 6. dashboard stats
    {
      const r = await fetch(BASE + "/api/dashboard", { headers: { cookie } });
      assertEq(r.status, 200, "GET /dashboard");
      const data = await r.json();
      assert(data.totals.products === 1, `totalProducts=${data.totals.products}`);
      console.log(`[api-smoke]  ok — dashboard products=${data.totals.products} totalStock=${data.totals.totalStock}`);
    }

    // 7. seller login & restricted product update
    let sellerCookie = "";
    {
      const r = await fetch(BASE + "/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "seller@pharmacare.test", password: "Demo@123" }),
      });
      assertEq(r.status, 200, "seller login");
      sellerCookie = (r.headers.get("set-cookie") || "").split(";")[0];
    }
    {
      const r = await fetch(BASE + `/api/products/${product._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", cookie: sellerCookie },
        body: JSON.stringify({ name: "Hacked" }),
      });
      assertEq(r.status, 403, "seller cannot update products");
      console.log("[api-smoke]  ok — seller blocked from updating products");
    }

    // 8. record a sale as seller
    {
      const r = await fetch(BASE + "/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json", cookie: sellerCookie },
        body: JSON.stringify({ productId: String(product._id), quantity: 3, note: "Walk-in" }),
      });
      assertEq(r.status, 200, "POST /sales");
      console.log("[api-smoke]  ok — sale recorded");
    }

    // 9. admin sees notification
    {
      const r = await fetch(BASE + "/api/notifications", { headers: { cookie } });
      assertEq(r.status, 200, "GET /notifications");
      const data = await r.json();
      const list = data.items || data.notifications || [];
      const saleNotif = list.find((n: any) => n.type === "sale");
      assert(!!saleNotif, "admin should have sale notification");
      console.log(`[api-smoke]  ok — admin sees ${list.length} notifications including sale`);
    }

    // 10. inventory history
    {
      const r = await fetch(BASE + "/api/inventory", { headers: { cookie } });
      assertEq(r.status, 200, "GET /inventory");
      const data = await r.json();
      const history = data.items || data.history || [];
      assert(history.length >= 1, "inventory history has entries");
      console.log(`[api-smoke]  ok — inventory history (${history.length} entries)`);
    }

    // 11. reports (sales)
    {
      const r = await fetch(BASE + "/api/reports?kind=sales", { headers: { cookie } });
      assertEq(r.status, 200, "GET /reports?sales");
      const data = await r.json();
      assert(Array.isArray(data.rows) && data.rows.length >= 1, "sales report has rows");
      console.log(`[api-smoke]  ok — sales report (${data.rows.length} rows, total ${data.totals?.totalAmount})`);
    }

    // 12. forbidden access
    {
      const r = await fetch(BASE + "/api/users");
      assertEq(r.status, 403, "/api/users requires admin role");
      console.log("[api-smoke]  ok — /api/users protected (403 for unauthenticated)");
    }

    // 13. logout
    {
      const r = await fetch(BASE + "/api/auth/logout", { method: "POST", headers: { cookie } });
      assertEq(r.status, 200, "logout");
      console.log("[api-smoke]  ok — logout");
    }

    console.log("\n[api-smoke] ALL HTTP CHECKS PASSED ✅");
  } finally {
    child.kill();
    await new Promise((r) => setTimeout(r, 500));
    await mongod.stop();
    try { fs.unlinkSync(envPath); } catch {}
  }
}

function assertEq(actual: any, expected: any, msg: string) {
  if (actual !== expected) {
    console.error(`[api-smoke] FAIL: ${msg} (expected ${expected}, got ${actual})`);
    process.exit(1);
  }
}

function assert(cond: any, msg: string) {
  if (!cond) {
    console.error("[api-smoke] FAIL:", msg);
    process.exit(1);
  }
}

start().catch((e) => {
  console.error("[api-smoke] crashed:", e);
  process.exit(1);
});
