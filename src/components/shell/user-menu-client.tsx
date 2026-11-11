"use client";

import { useRef } from "react";
import Link from "next/link";
import { Building2, Check, ChevronsUpDown, CircleUserRound, LogOut } from "lucide-react";
import { Avatar } from "@/components/ui/misc";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { switchOrganization } from "@/app/(app)/shell-actions";
import { cn } from "@/lib/utils";
import { SIDEBAR_FADE } from "./sidebar";
import { useSidebarCollapsed } from "./sidebar-state";

export function UserMenuClient({
  name,
  email,
  orgName,
  orgId,
  orgs,
  collapsible = false,
}: {
  name: string;
  email: string;
  orgName: string;
  orgId: string;
  orgs: { id: string; name: string }[];
  collapsible?: boolean;
}) {
  const signOutForm = useRef<HTMLFormElement>(null);
  const collapsed = useSidebarCollapsed();
  // Com o menu recolhido, abre ao lado do avatar em vez de em cima dele
  const beside = collapsible && collapsed;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger className="flex w-full cursor-pointer items-center gap-2.5 overflow-hidden rounded-lg px-2 py-1.5 text-left outline-none transition-[padding] duration-200 hover:bg-black/[0.035] focus-visible:ring-2 focus-visible:ring-accent/40 data-[state=open]:bg-black/[0.05] collapsed:px-0.5 motion-reduce:transition-none">
          <Avatar name={name} />
          <span className={cn("min-w-0 flex-1", SIDEBAR_FADE)}>
            <span className="block truncate text-[13px] font-medium text-ink">{name}</span>
            <span className="block truncate text-xs text-ink-3">{orgName}</span>
          </span>
          <ChevronsUpDown className={cn("size-3.5 shrink-0 text-ink-4", SIDEBAR_FADE)} />
        </DropdownMenuTrigger>
        <DropdownMenuContent
          side={beside ? "right" : "top"}
          align={beside ? "end" : "start"}
          sideOffset={beside ? 14 : 6}
          className="w-60"
        >
          <DropdownMenuLabel>
            <span className="block truncate font-medium text-ink">{name}</span>
            <span className="block truncate">{email}</span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {orgs.length > 1 ? (
            <>
              <DropdownMenuLabel>Empresas</DropdownMenuLabel>
              {orgs.map((org) => (
                <DropdownMenuItem key={org.id} onSelect={() => void switchOrganization(org.id)}>
                  <span className="flex-1 truncate">{org.name}</span>
                  {org.id === orgId ? <Check className="!text-accent" /> : null}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
            </>
          ) : null}
          <DropdownMenuItem asChild>
            <Link href="/configuracoes/conta">
              <CircleUserRound />
              Minha conta
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/configuracoes/empresa">
              <Building2 />
              Empresa e time
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => signOutForm.current?.requestSubmit()}>
            <LogOut />
            Sair
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <form ref={signOutForm} action="/auth/signout" method="post" className="hidden" />
    </>
  );
}
