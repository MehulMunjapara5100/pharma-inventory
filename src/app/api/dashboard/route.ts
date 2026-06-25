import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Product } from "@/models/Product";
import { Sale } from "@/models/Sale";
import { InventoryHistory } from "@/models/InventoryHistory";
import { User } from "@/models/User";

export async function GET() {
  try {
    await connectDB();
    const products = await Product.find().lean();
    const sales = await Sale.find().lean();
    const history = await InventoryHistory.find().sort({ createdAt: -1 }).limit(50).lean();
    const users = await User.find().lean();

    const totals = {
      products: products.length,
      totalStock: products.reduce((a, p) => a + p.quantity, 0),
      stockValue: products.reduce((a, p) => a + p.quantity * p.purchasePrice, 0),
      retailValue: products.reduce((a, p) => a + p.quantity * p.sellingPrice, 0),
      sales: sales.reduce((a, s) => a + s.totalAmount, 0),
      lowStock: products.filter((p) => p.quantity <= p.minStockLevel && p.quantity > 0).length,
      outOfStock: products.filter((p) => p.quantity <= 0).length,
      expired: products.filter((p) => new Date(p.expiryDate) < new Date()).length,
      nearExpiry: products.filter((p) => {
        const days = (new Date(p.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
        return days >= 0 && days <= 30;
      }).length,
      users: users.length
    };

    const lowStockProducts = products
      .filter((p) => p.quantity <= p.minStockLevel)
      .sort((a, b) => a.quantity - b.quantity)
      .slice(0, 10);

    const expiryProducts = products
      .filter((p) => new Date(p.expiryDate) < new Date() || ((new Date(p.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) <= 60)
      .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime())
      .slice(0, 10);

    const recentSales = sales.slice(-10).reverse();

    return NextResponse.json({
      totals,
      lowStockProducts,
      expiryProducts,
      recentSales,
      recentHistory: history.slice(0, 10)
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}
