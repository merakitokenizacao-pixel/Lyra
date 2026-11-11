"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export function ClientSearch({ defaultValue, view, status }: { defaultValue: string; view: string; status: string }) {
  const router = useRouter();
  const [value, setValue] = useState(defaultValue);
  const [pending, startTransition] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function apply(q: string) {
    const sp = new URLSearchParams();
    if (view !== "list") sp.set("view", view);
    if (status !== "all" && view === "list") sp.set("status", status);
    if (q) sp.set("q", q);
    const qs = sp.toString();
    startTransition(() => router.replace(qs ? `/clientes?${qs}` : "/clientes", { scroll: false }));
  }

  return (
    <div className="relative w-full sm:w-72">
      <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-ink-4" />
      <Input
        value={value}
        onChange={(e) => {
          const next = e.target.value;
          setValue(next);
          if (timer.current) clearTimeout(timer.current);
          timer.current = setTimeout(() => apply(next.trim()), 300);
        }}
        placeholder="Buscar cliente, segmento ou e-mail"
        className="pl-8"
        aria-label="Buscar clientes"
      />
      {pending ? <Loader2 className="absolute top-1/2 right-2.5 size-3.5 -translate-y-1/2 animate-spin text-ink-4" /> : null}
    </div>
  );
}
