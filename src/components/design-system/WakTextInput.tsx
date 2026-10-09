import type { InputHTMLAttributes } from "react";

type WakTextInputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
};

export function WakTextInput({
  className = "",
  id,
  label,
  ...props
}: WakTextInputProps) {
  return (
    <label className={["wak-input-field", className].filter(Boolean).join(" ")}>
      <span>{label}</span>
      <input {...props} id={id} />
    </label>
  );
}
