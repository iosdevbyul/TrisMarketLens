interface PageHeaderProps {
  eyebrow: string;
  title: string;
  description: string;
  badge?: string;
}

export function PageHeader({
  eyebrow,
  title,
  description,
  badge,
}: PageHeaderProps) {
  return (
    <header className="hero">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="hero-copy">{description}</p>
      </div>
      {badge ? <span className="mock-badge">{badge}</span> : null}
    </header>
  );
}
