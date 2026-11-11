"use client";

import { useOptimistic, useTransition } from "react";
import { toast } from "sonner";
import { ChevronDown } from "lucide-react";
import { CLIENT_STATUSES, CLIENT_STATUS_ORDER, type ClientStatus } from "@/lib/constants";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { setClientStatus } from "../actions";

export function ClientStatusSelect({ clientId, status }: { clientId: string; status: ClientStatus }) {
  const [current, setCurrent] = useOptimistic(status);
  const [pending, startTransition] = useTransition();
  const meta = CLIENT_STATUSES[current];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={pending}
        className="inline-flex h-7 cursor-pointer items-center gap-2 rounded-full border border-line bg-panel pr-2 pl-2.5 text-[12.5px] font-medium text-ink-2 shadow-xs outline-none hover:border-line-strong focus-visible:ring-2 focus-visible:ring-accent/40"
      >
        <span className="size-2 rounded-full" style={{ backgroundColor: meta.color }} aria-hidden />
        {meta.label}
        <ChevronDown className="size-3.5 text-ink-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel>Status do cliente</DropdownMenuLabel>
        {CLIENT_STATUS_ORDER.map((s) => (
          <DropdownMenuItem
            key={s}
            onSelect={() => {
              if (s === current) return;
              startTransition(async () => {
                setCurrent(s);
                const result = await setClientStatus(clientId, s);
                if (!result.ok) toast.error(result.error);
                else toast(`Status alterado para ${CLIENT_STATUSES[s].label}`);
              });
            }}
            className="items-start"
          >
            <span className="mt-1.5 size-2 shrink-0 rounded-full" style={{ backgroundColor: CLIENT_STATUSES[s].color }} />
            <span>
              <span className="block font-medium">{CLIENT_STATUSES[s].label}</span>
              <span className="block text-xs text-ink-3">{CLIENT_STATUSES[s].description}</span>
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
