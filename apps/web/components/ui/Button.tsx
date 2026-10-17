import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "info" | "success" | "danger" | "dark" | "ghost";
type Size = "sm" | "md" | "lg";

// Text is always ink on accent fills (Design System v2.0 §4.1 contrast rule).
const VARIANT_CLASS: Record<Variant, string> = {
  primary: "bg-yellow text-ink",
  secondary: "bg-white text-ink",
  info: "bg-blue text-ink",
  success: "bg-green text-ink",
  danger: "bg-red text-ink",
  dark: "bg-ink text-white",
  ghost: "bg-transparent text-ink hover:bg-paper-deep",
};

const SIZE_CLASS: Record<Size, string> = {
  sm: "h-9 px-3 text-xs shadow-nb-sm",
  md: "h-11 px-4 text-sm shadow-nb-sm",
  lg: "h-14 px-5 text-sm shadow-nb-md",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

/** §4.3 — hard shadow; pressing shifts the button onto its shadow. */
export function Button({ variant = "primary", size = "md", type = "button", className = "", children, ...rest }: ButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-nb border-3 border-ink font-bold uppercase tracking-wide transition-[transform,box-shadow] duration-100 hover:-translate-x-px hover:-translate-y-px active:translate-x-[3px] active:translate-y-[3px] active:shadow-none disabled:pointer-events-none disabled:opacity-40 ${VARIANT_CLASS[variant]} ${SIZE_CLASS[size]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
