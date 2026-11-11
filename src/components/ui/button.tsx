import * as React from "react";
import { Slot } from "radix-ui";
import { cn } from "@/lib/utils";

const VARIANTS = {
  primary: "bg-ink text-white shadow-xs hover:bg-ink-2 disabled:bg-ink/60",
  secondary: "border border-line bg-panel text-ink shadow-xs hover:border-line-strong hover:bg-subtle",
  ghost: "text-ink-2 hover:bg-hover hover:text-ink",
  accent: "bg-accent text-white shadow-xs hover:bg-accent-hover",
  danger: "border border-line bg-panel text-danger shadow-xs hover:border-red-200 hover:bg-red-50",
  "danger-solid": "bg-danger text-white shadow-xs hover:bg-red-700",
  link: "h-auto px-0 text-accent hover:underline underline-offset-4",
} as const;

const SIZES = {
  xs: "h-6 gap-1 rounded-md px-2 text-xs",
  sm: "h-7 gap-1.5 rounded-md px-2.5 text-[12.5px]",
  md: "h-8 gap-1.5 rounded-lg px-3 text-[13px]",
  lg: "h-10 gap-2 rounded-lg px-4 text-sm",
  icon: "size-8 rounded-lg",
  "icon-sm": "size-7 rounded-md",
} as const;

export type ButtonVariant = keyof typeof VARIANTS;
export type ButtonSize = keyof typeof SIZES;

export function buttonClass(variant: ButtonVariant = "secondary", size: ButtonSize = "md", className?: string) {
  return cn(
    "inline-flex shrink-0 cursor-pointer items-center justify-center font-medium whitespace-nowrap transition-colors select-none",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
    "disabled:pointer-events-none disabled:opacity-55 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
    VARIANTS[variant],
    SIZES[size],
    className,
  );
}

export type ButtonProps = React.ComponentProps<"button"> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  asChild?: boolean;
};

export function Button({ variant = "secondary", size = "md", asChild, className, type, ...props }: ButtonProps) {
  const Comp = asChild ? Slot.Root : "button";
  return (
    <Comp
      type={asChild ? undefined : (type ?? "button")}
      className={buttonClass(variant, size, className)}
      {...props}
    />
  );
}
