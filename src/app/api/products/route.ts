import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Product } from "@/models/Product";
import { InventoryHistory } from "@/models/InventoryHistory";
import { Notification } from "@/models/Notification";
import { getAuthFromCookies, verifyToken } from "@/lib/auth";
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
    const q = searchParams.get("q");
    const status = searchParams.get("status");
    const category = searchParams.get("category");
    const filter: any = {};
    if (q) filter.$or = [
      { name: { $regex: q, $options: "i" } },
      { sku: { $regex: q, $options: "i" } },
      { manufacturer: { $regex: q, $options: "i" } }
    ];
    if (status) filter.status = status;
    if (category) filter.category = category;

    const products = await Product.find(filter).sort({ updatedAt: -1 }).limit(500).lean();
    return NextResponse.json({ products });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const me = auth();
    if (!me || !hasPermission(me.role, "products:write")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    await connectDB();
    const body = await req.json();
    const required = ["name", "sku", "category", "expiryDate", "purchasePrice", "sellingPrice"];
    for (const k of required) {
      if (body[k] === undefined || body[k] === "" || body[k] === null) {
        return NextResponse.json({ error: `Field '${k}' is required.` }, { status: 400 });
      }
    }
    const dup = await Product.findOne({ sku: body.sku });
    if (dup) return NextResponse.json({ error: "SKU already exists." }, { status: 409 });

    const product = await Product.create({
      ...body,
      expiryDate: new Date(body.expiryDate),
      createdBy: me.uid,
      updatedBy: me.uid
    });
    await InventoryHistory.create({
      productId: product._id,
      productName: product.name,
      sku: product.sku,
      action: "create",
      previousQty: 0,
      changeQty: product.quantity,
      newQty: product.quantity,
      note: "Product created",
      performedBy: me.uid,
      performedByName: me.name,
      performedByRole: me.role
    });
    await Notification.create({
      title: "New product added",
      message: `${me.name} added ${product.name} (${product.sku})`,
      type: "new_product",
      level: "success",
      targetRoles: ["admin", "manager"],
      meta: { productId: String(product._id) }
    });
    return NextResponse.json({ success: true, product });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}
