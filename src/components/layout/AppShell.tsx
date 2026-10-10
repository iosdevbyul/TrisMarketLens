import type { ReactNode } from "react";

import { getLocale } from "@/i18n/server";
import { Sidebar } from "@/components/navigation/Sidebar";

export async function AppShell({ children }: { children: ReactNode }) {
  const locale = await getLocale();
  return (
    <div className="app-shell">
      <Sidebar locale={locale} />
      <main className="content">{children}</main>
    </div>
  );
}
