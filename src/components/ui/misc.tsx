import * as React from "react";
import { cn } from "@/lib/utils";
import { initials } from "@/lib/format";

/* ---------- Card ---------- */
export function Card({ className, ...props }: React.ComponentProps<"section">) {
  return <section className={cn("rounded-xl border border-line bg-panel shadow-card", className)} {...props} />;
}

export function CardHeader({
  title,
  description,
  action,
  icon,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("flex items-start justify-between gap-3 px-4 pt-3.5 pb-3", className)}>
      <div className="flex min-w-0 items-center gap-2">
        {icon ? <span className="text-ink-3 [&_svg]:size-4">{icon}</span> : null}
        <div className="min-w-0">
          <h2 className="text-[13.5px] font-semibold tracking-tight text-ink">{title}</h2>
          {description ? <p className="mt-0.5 text-xs text-ink-3">{description}</p> : null}
        </div>
      </div>
      {action ? <div className="flex shrink-0 items-center gap-1.5">{action}</div> : null}
    </header>
  );
}

/* ---------- Avatar ---------- */
const AVATAR_TINTS = [
  "bg-stone-200 text-stone-700",
  "bg-blue-100 text-blue-800",
  "bg-violet-100 text-violet-800",
  "bg-amber-100 text-amber-800",
  "bg-emerald-100 text-emerald-800",
  "bg-rose-100 text-rose-800",
  "bg-teal-100 text-teal-800",
];

function hash(value: string) {
  let h = 0;
  for (let i = 0; i < value.length; i++) h = (h * 31 + value.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function Avatar({
  name,
  size = "md",
  className,
}: {
  name: string | null | undefined;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
}) {
  const tint = AVATAR_TINTS[hash(name ?? "?") % AVATAR_TINTS.length];
  return (
    <span
      title={name ?? undefined}
      className={cn(
        "inline-grid shrink-0 place-items-center rounded-full font-semibold select-none",
        size === "xs" && "size-5 text-[9px]",
        size === "sm" && "size-6 text-[10px]",
        size === "md" && "size-8 text-xs",
        size === "lg" && "size-11 text-sm",
        size === "xl" && "size-16 text-lg",
        tint,
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}

/* ---------- Skeleton ---------- */
export function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("animate-pulse rounded-md bg-hover", className)} {...props} />;
}

/* ---------- Empty state ---------- */
export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center px-6 py-12 text-center", className)}>
      {icon ? <div className="mb-3 text-ink-4">{icon}</div> : null}
      <p className="text-[13.5px] font-semibold text-ink">{title}</p>
      {description ? <p className="mt-1 max-w-sm text-[13px] text-ink-3">{description}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

/* ---------- Key/value list ---------- */
export function DescList({ items, className }: { items: { label: string; value: React.ReactNode }[]; className?: string }) {
  return (
    <dl className={cn("divide-y divide-line", className)}>
      {items.map((item) => (
        <div key={item.label} className="grid grid-cols-[minmax(96px,38%)_1fr] gap-3 px-4 py-2.5">
          <dt className="text-[12.5px] text-ink-3">{item.label}</dt>
          <dd className="min-w-0 text-[13px] break-words text-ink">{item.value ?? "—"}</dd>
        </div>
      ))}
    </dl>
  );
}

/* ---------- Kbd-like count ---------- */
export function Count({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("rounded-md bg-hover px-1.5 py-px font-mono text-[11px] text-ink-3 tabular-nums", className)}>
      {children}
    </span>
  );
}
