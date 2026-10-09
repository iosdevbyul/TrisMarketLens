import type { ButtonHTMLAttributes } from "react";

type WakButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary";
};

export function WakButton({
  className = "",
  type = "button",
  variant = "primary",
  ...props
}: WakButtonProps) {
  return (
    <button
      {...props}
      className={["wak-button", `wak-button--${variant}`, className].filter(Boolean).join(" ")}
      type={type}
    />
  );
}
