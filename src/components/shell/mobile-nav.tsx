"use client";

import { Suspense, useState, type ReactNode } from "react";
import { Dialog as D } from "radix-ui";
import { Menu, X } from "lucide-react";
import { LyroLogo } from "@/components/brand";
import { ActiveNav, NavLinks } from "./nav";

export function MobileNav({ userMenu }: { userMenu: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <D.Root open={open} onOpenChange={setOpen}>
      <D.Trigger className="grid size-8 cursor-pointer place-items-center rounded-lg text-ink-2 hover:bg-black/5">
        <Menu className="size-5" />
        <span className="sr-only">Abrir menu</span>
      </D.Trigger>
      <D.Portal>
        <D.Overlay className="fixed inset-0 z-50 bg-ink/25 data-[state=open]:animate-fade-in" />
        <D.Content className="fixed inset-y-0 left-0 z-50 flex w-[min(300px,85vw)] flex-col bg-canvas p-3 shadow-lift outline-none data-[state=open]:animate-fade-in">
          <div className="flex items-center justify-between px-1.5 pt-1 pb-5">
            <D.Title asChild>
              <span>
                <LyroLogo />
              </span>
            </D.Title>
            <D.Description className="sr-only">Navegação principal</D.Description>
            <D.Close className="grid size-8 cursor-pointer place-items-center rounded-lg text-ink-2 hover:bg-black/5">
              <X className="size-4" />
              <span className="sr-only">Fechar menu</span>
            </D.Close>
          </div>
          <div className="flex-1 overflow-y-auto">
            <Suspense fallback={<NavLinks pathname={null} />}>
              <ActiveNav onNavigate={() => setOpen(false)} />
            </Suspense>
          </div>
          <div className="border-t border-line pt-2">{userMenu}</div>
        </D.Content>
      </D.Portal>
    </D.Root>
  );
}
