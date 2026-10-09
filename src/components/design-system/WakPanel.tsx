import type { ElementType, ReactNode } from "react";

type WakPanelProps<T extends ElementType> = {
  as?: T;
  children: ReactNode;
  className?: string;
};

/** Presentational surface consistent with WakTrainer's WakCard. */
export function WakPanel<T extends ElementType = "article">({
  as,
  children,
  className = "",
}: WakPanelProps<T>) {
  const Component = as ?? "article";
  return <Component className={["panel", className].filter(Boolean).join(" ")}>{children}</Component>;
}
