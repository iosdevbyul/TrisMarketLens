import type { Metadata } from "next";

import { AppShell } from "@/components/layout/AppShell";

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
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
