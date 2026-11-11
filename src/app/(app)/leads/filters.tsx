"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2, Search, X } from "lucide-react";
import { LEAD_SOURCES, TEMPERATURES, TEMPERATURE_ORDER } from "@/lib/constants";
import { Input, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type Values = { q: string; stage: string; temperature: string; source: string };

export function LeadFilters({ values, stages }: { values: Values; stages: { id: string; name: string }[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const [q, setQ] = useState(values.q);
  const [current, setCurrent] = useState(values);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Mantém os selects alinhados com a URL (ex.: botão voltar do navegador)
  const urlKey = `${values.stage}|${values.temperature}|${values.source}`;
  const [syncedKey, setSyncedKey] = useState(urlKey);
  if (syncedKey !== urlKey) {
    setSyncedKey(urlKey);
    setCurrent((prev) => ({ ...prev, stage: values.stage, temperature: values.temperature, source: values.source }));
  }

  function apply(next: Partial<Values>) {
    const merged = { ...current, ...next };
    setCurrent(merged);
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(merged)) if (value) params.set(key, value);
    const qs = params.toString();
    startTransition(() => router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
  }

  useEffect(() => () => void (timer.current && clearTimeout(timer.current)), []);

  const hasFilters = Boolean(q || current.stage || current.temperature || current.source);

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-line px-4 py-3 sm:px-6">
      <div className="relative w-full sm:w-72">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-ink-4" />
        <Input
          value={q}
          onChange={(e) => {
            const value = e.target.value;
            setQ(value);
            if (timer.current) clearTimeout(timer.current);
            timer.current = setTimeout(() => apply({ q: value.trim() }), 300);
          }}
          placeholder="Buscar por nome, empresa ou e-mail"
          className="pl-8"
          aria-label="Buscar leads"
        />
        {pending ? <Loader2 className="absolute top-1/2 right-2.5 size-3.5 -translate-y-1/2 animate-spin text-ink-4" /> : null}
      </div>
      <Select
        value={current.stage}
        onChange={(e) => apply({ stage: e.target.value })}
        className="w-[calc(50%-4px)] sm:w-44"
        aria-label="Filtrar por etapa"
      >
        <option value="">Todas as etapas</option>
        {stages.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </Select>
      <Select
        value={current.temperature}
        onChange={(e) => apply({ temperature: e.target.value })}
        className="w-[calc(50%-4px)] sm:w-36"
        aria-label="Filtrar por temperatura"
      >
        <option value="">Temperatura</option>
        {TEMPERATURE_ORDER.map((t) => (
          <option key={t} value={t}>
            {TEMPERATURES[t].label}
          </option>
        ))}
      </Select>
      <Select
        value={current.source}
        onChange={(e) => apply({ source: e.target.value })}
        className="w-[calc(50%-4px)] sm:w-40"
        aria-label="Filtrar por origem"
      >
        <option value="">Todas as origens</option>
        {Object.entries(LEAD_SOURCES).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </Select>
      {hasFilters ? (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setQ("");
            apply({ q: "", stage: "", temperature: "", source: "" });
          }}
        >
          <X />
          Limpar
        </Button>
      ) : null}
    </div>
  );
}
