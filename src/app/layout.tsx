import type { Metadata } from "next";
import { getLocale } from "@/i18n/server";

import { AppShell } from "@/components/layout/AppShell";

import "./globals.css";

export const metadata: Metadata = {
  title: "Tris Market Lens",
  description: "Research-driven market intelligence dashboard",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  return (
    <html lang={locale}>
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
