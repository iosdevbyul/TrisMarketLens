import type { ReactNode } from "react";

import { getLocale } from "@/i18n/server";
import { Sidebar } from "@/components/navigation/Sidebar";

export async function AppShell({ children }: { children: ReactNode }) {
  const locale = await getLocale();
  const sourceMode = process.env.MARKET_LENS_DATA_SOURCE === "http" ? "http" : process.env.MARKET_LENS_DATA_SOURCE === "mock" || !process.env.MARKET_LENS_DATA_SOURCE ? "mock" : "disconnected";
  return (
    <div className="app-shell">
      <Sidebar locale={locale} sourceMode={sourceMode} />
      <main id="main-content" className="content" tabIndex={-1}>{children}</main>
    </div>
  );
}
