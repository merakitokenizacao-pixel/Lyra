import type { ReactNode } from "react";

/** Moldura das telas de entrada: cartão branco com cantos marcados, sobre a grade. */
export function AuthCard({ title, muted, children }: { title: string; muted: string; children: ReactNode }) {
  return (
    <div className="relative w-full max-w-[400px]">
      <span className="absolute -top-px -left-px size-3 border-t border-l border-ink/30" aria-hidden />
      <span className="absolute -top-px -right-px size-3 border-t border-r border-ink/30" aria-hidden />
      <span className="absolute -bottom-px -left-px size-3 border-b border-l border-ink/30" aria-hidden />
      <span className="absolute -right-px -bottom-px size-3 border-r border-b border-ink/30" aria-hidden />
      <div className="border border-line bg-panel px-6 py-7 shadow-card sm:px-8 sm:py-9">
        <h1 className="font-display text-[32px] leading-[1.05] text-ink">
          {title}
          <br />
          <span className="text-ink-4">{muted}</span>
        </h1>
        <div className="mt-7">{children}</div>
      </div>
    </div>
  );
}
