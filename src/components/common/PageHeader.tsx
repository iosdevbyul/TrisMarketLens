import { getTranslator } from "@/i18n/server";
interface PageHeaderProps {
  eyebrow: string;
  title: string;
  description: string;
  badge?: string;
}

export async function PageHeader({
  eyebrow,
  title,
  description,
  badge,
}: PageHeaderProps) {
  const t = await getTranslator();
  return (
    <header className="hero">
      <div>
        <p className="eyebrow">{t(eyebrow)}</p>
        <h1>{t(title)}</h1>
        <p className="hero-copy">{t(description)}</p>
      </div>
      {badge ? <span className="mock-badge">{t(badge)}</span> : null}
    </header>
  );
}
