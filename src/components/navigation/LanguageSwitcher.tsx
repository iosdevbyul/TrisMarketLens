"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Locale } from "@/i18n/translations";

export function LanguageSwitcher({ locale }: { locale: Locale }) {
  const router = useRouter();
  const [selected, setSelected] = useState(locale);
  function choose(next: Locale) {
    if (selected === next) return;
    document.cookie = `tris-locale=${next}; Path=/; Max-Age=31536000; SameSite=Lax`;
    document.documentElement.lang = next;
    setSelected(next);
    router.refresh();
  }
  return <div className="language-switcher" role="group" aria-label="Language / 언어">
    <button type="button" aria-label="English" aria-pressed={selected === "en"} onClick={() => choose("en")}>🇺🇸 EN</button>
    <button type="button" aria-label="한국어" aria-pressed={selected === "ko"} onClick={() => choose("ko")}>🇰🇷 KO</button>
  </div>;
}
