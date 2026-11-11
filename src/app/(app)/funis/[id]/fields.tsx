"use client";

import { useId, useState, type ReactNode } from "react";
import { formatInput, parseDecimal } from "@/lib/funnels";
import { cn } from "@/lib/utils";

/**
 * Campo numérico em pt-BR ("6.000", "12,5"). Enquanto a pessoa digita, o texto fica como ela escreveu
 * e o número vai para o funil a cada tecla; fora de foco, mostra o valor formatado.
 */
export function NumberField({
  label,
  value,
  onChange,
  onFocus,
  prefix,
  suffix,
  min = 0,
  max = 1_000_000_000,
  allowEmpty = false,
  placeholder,
  hint,
  compact = false,
  className,
  "aria-label": ariaLabel,
}: {
  label?: ReactNode;
  value: number | null;
  onChange: (value: number | null) => void;
  onFocus?: () => void;
  prefix?: string;
  suffix?: string;
  min?: number;
  max?: number;
  allowEmpty?: boolean;
  placeholder?: string;
  hint?: ReactNode;
  compact?: boolean;
  className?: string;
  "aria-label"?: string;
}) {
  const id = useId();
  const [text, setText] = useState("");
  const [focused, setFocused] = useState(false);
  const shown = focused ? text : formatInput(value);

  return (
    <div className={cn("flex min-w-0 flex-col gap-1", className)}>
      {label ? (
        <label htmlFor={id} className="text-[11.5px] font-medium text-ink-3">
          {label}
        </label>
      ) : null}
      <div
        className={cn(
          "flex items-center rounded-lg border border-line bg-panel shadow-xs transition-colors",
          "hover:border-line-strong focus-within:border-accent focus-within:ring-3 focus-within:ring-accent/12",
          compact ? "h-7" : "h-8",
        )}
      >
        {prefix ? <span className="pl-2.5 text-[12px] text-ink-4">{prefix}</span> : null}
        <input
          id={id}
          inputMode="decimal"
          autoComplete="off"
          aria-label={ariaLabel}
          value={shown}
          placeholder={placeholder}
          onFocus={(event) => {
            setText(formatInput(value));
            setFocused(true);
            onFocus?.();
            event.currentTarget.select();
          }}
          onBlur={() => setFocused(false)}
          onChange={(event) => {
            const raw = event.target.value;
            setText(raw);
            const parsed = parseDecimal(raw);
            if (parsed == null) {
              if (allowEmpty && raw.trim() === "") onChange(null);
              return;
            }
            onChange(Math.min(max, Math.max(min, parsed)));
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") event.currentTarget.blur();
          }}
          className={cn(
            "h-full w-full min-w-0 bg-transparent text-[13px] text-ink tabular-nums outline-none placeholder:text-ink-4",
            prefix ? "pl-1.5" : "pl-2.5",
            suffix ? "pr-1" : "pr-2.5",
            compact && "text-right",
          )}
        />
        {suffix ? <span className="pr-2.5 text-[12px] whitespace-nowrap text-ink-4">{suffix}</span> : null}
      </div>
      {hint ? <p className="text-[11.5px] leading-snug text-ink-4">{hint}</p> : null}
    </div>
  );
}

/** Bloco do painel lateral, com título discreto em caixa alta. */
export function PanelSection({
  title,
  action,
  children,
  className,
}: {
  title?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("border-b border-line px-4 py-3.5 last:border-b-0", className)}>
      {title ? (
        <div className="mb-2.5 flex items-center justify-between gap-2">
          <h3 className="text-[11px] font-medium tracking-wide text-ink-4 uppercase">{title}</h3>
          {action}
        </div>
      ) : null}
      {children}
    </section>
  );
}

/** Número de resumo: rótulo pequeno em cima, valor embaixo. */
export function Stat({ label, value, sub, className }: { label: ReactNode; value: ReactNode; sub?: ReactNode; className?: string }) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-0.5", className)}>
      <span className="truncate text-[11.5px] text-ink-3">{label}</span>
      <span className="truncate text-[15px] leading-5 font-semibold tracking-tight text-ink tabular-nums">{value}</span>
      {sub ? <span className="truncate text-[11px] text-ink-4">{sub}</span> : null}
    </div>
  );
}
