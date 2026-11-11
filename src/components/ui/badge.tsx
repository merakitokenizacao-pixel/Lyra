import * as React from "react";
import { cn } from "@/lib/utils";

const TONES = {
  neutral: "border-line bg-panel text-ink-2",
  muted: "border-transparent bg-hover text-ink-2",
  accent: "border-transparent bg-accent-soft text-accent",
  success: "border-transparent bg-emerald-50 text-emerald-700",
  warning: "border-transparent bg-amber-50 text-amber-700",
  danger: "border-transparent bg-red-50 text-red-700",
  dark: "border-transparent bg-ink text-white",
} as const;

export type BadgeTone = keyof typeof TONES;

export function Badge({
  tone = "neutral",
  className,
  ...props
}: React.ComponentProps<"span"> & { tone?: BadgeTone }) {
  return (
    <span
      className={cn(
        "inline-flex h-5.5 shrink-0 items-center gap-1.5 rounded-full border px-2 text-xs font-medium whitespace-nowrap [&_svg]:size-3",
        TONES[tone],
        className,
      )}
      {...props}
    />
  );
}

/** Pílula neutra com bolinha colorida — a cor identifica, o texto fica em tinta. */
export function DotBadge({
  dotClassName,
  color,
  children,
  className,
}: {
  dotClassName?: string;
  color?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Badge tone="neutral" className={className}>
      <span
        aria-hidden
        className={cn("size-1.5 shrink-0 rounded-full", dotClassName)}
        style={color ? { backgroundColor: color } : undefined}
      />
      {children}
    </Badge>
  );
}

/** Chip de categoria no topo dos cards (padrão visual da ROX). */
export function Chip({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1.5 rounded-full border border-line bg-subtle px-2.5 text-xs font-medium text-ink-2 [&_svg]:size-3.5 [&_svg]:text-ink-3",
        className,
      )}
      {...props}
    />
  );
}
