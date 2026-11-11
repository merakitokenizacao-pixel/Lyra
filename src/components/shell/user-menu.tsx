import { getContext } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { SIDEBAR_FADE } from "./sidebar";
import { UserMenuClient } from "./user-menu-client";

/** `collapsible`: está no menu do desktop, que pode recolher para só os ícones. */
export async function UserMenu({ collapsible = false }: { collapsible?: boolean }) {
  const ctx = await getContext();
  return (
    <UserMenuClient
      name={ctx.profile.full_name}
      email={ctx.profile.email ?? ""}
      orgName={ctx.org.name}
      orgId={ctx.org.id}
      orgs={ctx.orgs.map((o) => ({ id: o.id, name: o.name }))}
      collapsible={collapsible}
    />
  );
}

export function UserMenuFallback() {
  return (
    <div className="flex h-11 items-center gap-2.5 overflow-hidden rounded-lg px-2 collapsed:px-0.5">
      <span className="size-8 shrink-0 animate-pulse rounded-full bg-black/5" />
      <span className={cn("flex flex-col gap-1.5", SIDEBAR_FADE)}>
        <span className="h-2.5 w-24 animate-pulse rounded bg-black/5" />
        <span className="h-2 w-16 animate-pulse rounded bg-black/5" />
      </span>
    </div>
  );
}
