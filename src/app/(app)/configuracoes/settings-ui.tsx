import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Título de cada seção das configurações, na serifa editorial dos títulos do app. */
export function SettingsTitle({ title, description }: { title: string; description?: ReactNode }) {
  return (
    <header>
      <h2 className="font-display text-[30px] leading-[1.08] text-ink">{title}</h2>
      {description ? <p className="mt-1.5 max-w-xl text-[13.5px] leading-relaxed text-ink-3">{description}</p> : null}
    </header>
  );
}

/** Linha de configuração: rótulo e explicação à esquerda, controle à direita (empilha no celular). */
export function SettingRow({
  label,
  description,
  htmlFor,
  children,
  className,
}: {
  label: ReactNode;
  description?: ReactNode;
  htmlFor?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("grid gap-2.5 px-4 py-4 sm:grid-cols-[minmax(0,13rem)_minmax(0,1fr)] sm:gap-8 sm:px-5", className)}>
      <div className="min-w-0">
        {htmlFor ? (
          <label htmlFor={htmlFor} className="block text-[13px] font-medium text-ink">
            {label}
          </label>
        ) : (
          <p className="text-[13px] font-medium text-ink">{label}</p>
        )}
        {description ? <p className="mt-1 text-xs leading-relaxed text-ink-3">{description}</p> : null}
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

/** Rodapé dos formulários: avisa o que não foi salvo e concentra as ações. */
export function FormFooter({ dirty, children }: { dirty: boolean; children: ReactNode }) {
  return (
    <div className="flex min-h-13 flex-wrap items-center gap-3 rounded-b-xl bg-subtle px-4 py-2.5 sm:px-5">
      {dirty ? (
        <p className="flex items-center gap-1.5 text-xs text-ink-3" aria-live="polite">
          <span className="size-1.5 rounded-full bg-amber-500" aria-hidden />
          Alterações não salvas
        </p>
      ) : null}
      <div className="ml-auto flex items-center gap-2">{children}</div>
    </div>
  );
}
