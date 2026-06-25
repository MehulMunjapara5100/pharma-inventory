import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Product } from "@/models/Product";
import { Sale } from "@/models/Sale";
import { InventoryHistory } from "@/models/InventoryHistory";
import { User } from "@/models/User";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const kind = searchParams.get("kind") || "sales";

    if (kind === "sales") {
      const sales = await Sale.find().sort({ createdAt: -1 }).limit(500).lean();
      return NextResponse.json({ rows: sales });
    }
    if (kind === "stock") {
      const products = await Product.find().sort({ name: 1 }).limit(1000).lean();
      return NextResponse.json({ rows: products });
    }
    if (kind === "low-stock") {
      const products = await Product.find({ $expr: { $lte: ["$quantity", "$minStockLevel"] } }).lean();
      return NextResponse.json({ rows: products });
    }
    if (kind === "expiry") {
      const products = await Product.find({}).sort({ expiryDate: 1 }).lean();
      const now = Date.now();
      const filtered = products.filter((p) => (new Date(p.expiryDate).getTime() - now) / (1000 * 60 * 60 * 24) <= 60);
      return NextResponse.json({ rows: filtered });
    }
    if (kind === "users") {
      const users = await User.find().lean();
      return NextResponse.json({ rows: users.map((u: any) => ({ ...u, passwordHash: undefined })) });
    }
    return NextResponse.json({ rows: [] });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}
