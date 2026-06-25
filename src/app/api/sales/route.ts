import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Sale } from "@/models/Sale";
import { Product } from "@/models/Product";
import { InventoryHistory } from "@/models/InventoryHistory";
import { Notification } from "@/models/Notification";
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
    const { searchParams } = new URL(req.url);
    const filter: any = {};
    const me = auth();
    if (me?.role === "seller") filter.soldBy = me.uid;
    const q = searchParams.get("q");
    if (q) filter.$or = [
      { productName: { $regex: q, $options: "i" } },
      { sku: { $regex: q, $options: "i" } }
    ];
    const items = await Sale.find(filter).sort({ createdAt: -1 }).limit(200).lean();
    return NextResponse.json({ items });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const me = auth();
    if (!me || !hasPermission(me.role, "sales:write")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    await connectDB();
    const body = await req.json();
    const { productId, quantity, customerName, paymentMethod, note } = body;
    if (!productId || !quantity || quantity < 1) {
      return NextResponse.json({ error: "productId and a valid quantity are required." }, { status: 400 });
    }
    const product = await Product.findById(productId);
    if (!product) return NextResponse.json({ error: "Product not found." }, { status: 404 });
    if (product.quantity < quantity) {
      return NextResponse.json({ error: `Insufficient stock. Only ${product.quantity} available.` }, { status: 400 });
    }
    const previousQty = product.quantity;
    product.quantity = previousQty - quantity;
    await product.save();

    const totalAmount = quantity * product.sellingPrice;
    const sale = await Sale.create({
      productId: product._id,
      productName: product.name,
      sku: product.sku,
      quantity,
      unitPrice: product.sellingPrice,
      totalAmount,
      customerName: customerName || "",
      paymentMethod: paymentMethod || "cash",
      note: note || "",
      soldBy: me.uid,
      soldByName: me.name
    });

    await InventoryHistory.create({
      productId: product._id,
      productName: product.name,
      sku: product.sku,
      action: "sale",
      previousQty,
      changeQty: -quantity,
      newQty: product.quantity,
      note: `Sale${customerName ? ` to ${customerName}` : ""}`,
      performedBy: me.uid,
      performedByName: me.name,
      performedByRole: me.role
    });

    await Notification.create({
      title: "Sale recorded",
      message: `${me.name} sold ${quantity} × ${product.name} for ${totalAmount.toFixed(2)}.`,
      type: "sale",
      level: "success",
      targetRoles: ["admin", "manager"],
      meta: { productId: String(product._id), quantity, totalAmount }
    });

    if (product.quantity <= product.minStockLevel) {
      await Notification.create({
        title: "Low stock alert",
        message: `${product.name} is low on stock (${product.quantity} left, threshold ${product.minStockLevel}).`,
        type: "low_stock",
        level: "warning",
        targetRoles: ["admin", "manager"]
      });
    }

    return NextResponse.json({ success: true, sale });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}
