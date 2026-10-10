"use client";

import Link from "next/link";
import { translate, type Locale } from "@/i18n/translations";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { usePathname } from "next/navigation";

const navigation = [
  { href: "/", label: "Overview" },
  { href: "/stocks", label: "Stocks" },
  { href: "/models", label: "Models" },
  { href: "/evidence", label: "Evidence" },
  { href: "/backtesting", label: "Backtesting" },
];

export function Sidebar({ locale }: { locale: Locale }) {
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      <Link className="brand" href="/">
        <span className="brand-mark">T</span>
        <span>
          <span className="brand-name">Tris</span>
          <span className="brand-subtitle">Market Lens</span>
        </span>
      </Link>

      <LanguageSwitcher locale={locale} />
      <nav className="nav-list" aria-label="Primary navigation">
        {navigation.map((item) => {
          const active =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

          return (
            <Link
              aria-current={active ? "page" : undefined}
              className="nav-item"
              data-active={active}
              href={item.href}
              key={item.href}
            >
              {translate(locale, item.label)}
            </Link>
          );
        })}
      </nav>

      <div className="sidebar-note">
        <span className="live-dot" />
        {translate(locale, "Mock research data")}
      </div>
    </aside>
  );
}
