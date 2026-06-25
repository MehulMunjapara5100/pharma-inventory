import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
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

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    const p = await Product.findById(params.id).lean();
    if (!p) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ product: p });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const me = auth();
    if (!me || !hasPermission(me.role, "products:write")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    await connectDB();
    const body = await req.json();
    const prev = await Product.findById(params.id);
    if (!prev) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const prevQty = prev.quantity;

    const update: any = { ...body, updatedBy: me.uid };
    if (body.expiryDate) update.expiryDate = new Date(body.expiryDate);

    const product = await Product.findByIdAndUpdate(params.id, update, { new: true });

    if (typeof body.quantity === "number" && body.quantity !== prevQty) {
      await InventoryHistory.create({
        productId: product!._id,
        productName: product!.name,
        sku: product!.sku,
        action: "adjustment",
        previousQty: prevQty,
        changeQty: body.quantity - prevQty,
        newQty: body.quantity,
        note: body.note || "Manual edit",
        performedBy: me.uid,
        performedByName: me.name,
        performedByRole: me.role
      });
      await Notification.create({
        title: "Inventory updated",
        message: `${me.name} updated ${product!.name} stock to ${product!.quantity}`,
        type: "inventory",
        level: body.quantity < prevQty ? "warning" : "success",
        targetRoles: ["admin"],
        meta: { productId: String(product!._id) }
      });
    }
    return NextResponse.json({ success: true, product });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const me = auth();
    if (!me || !hasPermission(me.role, "products:delete")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    await connectDB();
    const product = await Product.findByIdAndDelete(params.id);
    if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });
    await InventoryHistory.create({
      productId: product._id,
      productName: product.name,
      sku: product.sku,
      action: "delete",
      previousQty: product.quantity,
      changeQty: -product.quantity,
      newQty: 0,
      note: "Product deleted",
      performedBy: me.uid,
      performedByName: me.name,
      performedByRole: me.role
    });
    await Notification.create({
      title: "Product deleted",
      message: `${me.name} deleted ${product.name} (${product.sku})`,
      type: "system",
      level: "warning",
      targetRoles: ["admin"]
    });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}
