import type { ReactNode } from "react";

interface WakSectionHeaderProps {
  eyebrow: string;
  title: string;
  trailing?: ReactNode;
  className?: string;
}

export function WakSectionHeader({
  eyebrow,
  title,
  trailing,
  className = "",
}: WakSectionHeaderProps) {
  return (
    <div className={["panel-heading", className].filter(Boolean).join(" ")}>
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
      </div>
      {trailing}
    </div>
  );
}
