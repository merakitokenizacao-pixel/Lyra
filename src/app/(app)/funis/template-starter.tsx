"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { FUNNEL_TEMPLATES } from "@/lib/funnels";
import { useAction } from "@/components/ui/use-action";
import { createFunnel } from "./actions";
import { TemplateChain } from "./template-chain";

/** Lista vazia: um clique num modelo já cria o funil e abre o quadro. */
export function TemplateStarter() {
  const { pending, run } = useAction();
  const [chosen, setChosen] = useState<string | null>(null);

  function start(key: string) {
    setChosen(key);
    const formData = new FormData();
    formData.set("template", key);
    run(() => createFunnel(formData));
  }

  return (
    <div className="flex w-full max-w-3xl flex-col items-center gap-4">
      <div className="grid w-full gap-3 text-left sm:grid-cols-3">
        {FUNNEL_TEMPLATES.filter((t) => t.key !== "blank").map((t) => (
          <button
            key={t.key}
            type="button"
            disabled={pending}
            onClick={() => start(t.key)}
            className="group flex cursor-pointer flex-col gap-2.5 rounded-xl border border-line bg-panel p-4 text-left shadow-card transition-colors hover:border-line-strong disabled:cursor-wait disabled:opacity-60"
          >
            <TemplateChain kinds={t.preview} />
            <span className="text-[13px] font-semibold text-ink group-hover:text-accent">{t.name}</span>
            <span className="text-[12px] leading-snug text-ink-3">{t.description}</span>
            <span className="mt-auto inline-flex items-center gap-1 pt-1 text-[12px] font-medium text-accent">
              {pending && chosen === t.key ? "Criando…" : "Usar este modelo"}
              <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
            </span>
          </button>
        ))}
      </div>
      <button
        type="button"
        disabled={pending}
        onClick={() => start("blank")}
        className="cursor-pointer text-[12.5px] text-ink-3 underline-offset-2 hover:text-ink hover:underline disabled:cursor-wait"
      >
        {pending && chosen === "blank" ? "Criando…" : "Ou comece com o quadro em branco"}
      </button>
    </div>
  );
}
