import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "PharmaCare — Inventory Management",
  description: "Modern pharma inventory management for pharmacies, vendors, and stores."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
