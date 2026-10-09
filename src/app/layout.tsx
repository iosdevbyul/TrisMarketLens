import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Tris Market Lens",
  description: "Research-driven market intelligence dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
