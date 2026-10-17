import type { HTMLAttributes, ReactNode } from "react";

type Tone = "white" | "paper" | "yellow" | "pink" | "blue" | "green" | "orange" | "red" | "purple" | "ink";
type Shadow = "none" | "sm" | "md" | "lg" | "xl";

const TONE_CLASS: Record<Tone, string> = {
  white: "bg-white text-ink",
  paper: "bg-paper text-ink",
  yellow: "bg-yellow text-ink",
  pink: "bg-pink text-ink",
  blue: "bg-blue text-ink",
  green: "bg-green text-ink",
  orange: "bg-orange text-ink",
  red: "bg-red text-ink",
  purple: "bg-purple text-ink",
  ink: "bg-ink text-white",
};

const SHADOW_CLASS: Record<Shadow, string> = {
  none: "",
  sm: "shadow-nb-sm",
  md: "shadow-nb-md",
  lg: "shadow-nb-lg",
  xl: "shadow-nb-xl",
};

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  tone?: Tone;
  shadow?: Shadow;
  padded?: boolean;
}

export function Card({ tone = "white", shadow = "md", padded = true, className = "", children, ...rest }: CardProps) {
  return (
    <div className={`rounded-nb border-3 border-ink ${TONE_CLASS[tone]} ${SHADOW_CLASS[shadow]} ${padded ? "p-5" : ""} ${className}`} {...rest}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`mb-3 text-xs font-bold uppercase tracking-widest ${className}`}>{children}</div>;
}
