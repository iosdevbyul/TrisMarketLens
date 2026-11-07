"use client";

import Link from "next/link";
import { translate, type Locale } from "../../i18n/translations";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { usePathname } from "next/navigation";

const navigation = [
  { href: "/", label: "Overview" },
  { href: "/research-path", label: "Research Path" },
  { href: "/stocks", label: "Stocks" },
  { href: "/operational-market", label: "Collected Market Data" },
  { href: "/screener", label: "AI Screener" },
  { href: "/history", label: "AI Analysis History" },
  { href: "/models", label: "Models" },
  { href: "/evidence", label: "Evidence" },
  { href: "/backtesting", label: "Backtesting" },
  { href: "/operations", label: "Operations" },
  { href: "/diagnostics", label: "Diagnostics" },
];

export function Sidebar({ locale, sourceMode }: { locale: Locale; sourceMode: "http" | "mock" | "disconnected" }) {
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      <a className="skip-link" href="#main-content">{locale === "ko" ? "본문으로 건너뛰기" : "Skip to main content"}</a>
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
            item.href === "/" ? pathname === "/" : pathname === item.href || pathname.startsWith(item.href + "/");

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

      <div className="sidebar-note" role="status">
        <span className="live-dot" data-source={sourceMode} aria-hidden="true" />
        {sourceMode === "http" ? (locale === "ko" ? "HTTP 연구 소스 설정됨 · 연결 상태는 진단에서 확인" : "HTTP research configured · verify connection in Diagnostics") : sourceMode === "mock" ? translate(locale, "Mock research data") : (locale === "ko" ? "연구 소스 연결 안 됨" : "Research source disconnected")}
      </div>
    </aside>
  );
}
