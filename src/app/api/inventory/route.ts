import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { InventoryHistory } from "@/models/InventoryHistory";
import { verifyToken } from "@/lib/auth";
import { cookies } from "next/headers";
import { hasPermission } from "@/lib/roles";

function auth() {
  const c = cookies().get("pharma_token")?.value;
  return c ? verifyToken(c) : null;
}

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const me = auth();
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("productId");
    const filter: any = {};
    if (productId) filter.productId = productId;
    if (me?.role === "vendor") filter.performedByRole = "vendor";
    const items = await InventoryHistory.find(filter).sort({ createdAt: -1 }).limit(200).lean();
    return NextResponse.json({ items });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const me = auth();
    if (!me || !hasPermission(me.role, "inventory:write")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    await connectDB();
    const body = await req.json();
    const { productId, changeQty, action, note } = body;
    if (!productId || typeof changeQty !== "number") {
      return NextResponse.json({ error: "productId and changeQty are required." }, { status: 400 });
    }
    const { Product } = await import("@/models/Product");
    const { Notification } = await import("@/models/Notification");
    const product = await Product.findById(productId);
    if (!product) return NextResponse.json({ error: "Product not found." }, { status: 404 });

    const previousQty = product.quantity;
    const newQty = Math.max(0, previousQty + changeQty);
    product.quantity = newQty;
    await product.save();

    await InventoryHistory.create({
      productId: product._id,
      productName: product.name,
      sku: product.sku,
      action: action || "adjustment",
      previousQty,
      changeQty,
      newQty,
      note: note || "",
      performedBy: me.uid,
      performedByName: me.name,
      performedByRole: me.role
    });

    await Notification.create({
      title: "Inventory updated",
      message: `${me.name} (${me.role}) adjusted ${product.name} stock from ${previousQty} to ${newQty}.`,
      type: "inventory",
      level: newQty < previousQty ? "warning" : "success",
      targetRoles: ["admin"],
      meta: { productId: String(product._id), previousQty, newQty }
    });

    if (newQty <= product.minStockLevel) {
      await Notification.create({
        title: "Low stock alert",
        message: `${product.name} is low on stock (${newQty} left, threshold ${product.minStockLevel}).`,
        type: "low_stock",
        level: "warning",
        targetRoles: ["admin", "manager"]
      });
    }
    return NextResponse.json({ success: true, product });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}
