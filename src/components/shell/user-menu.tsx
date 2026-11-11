import { getContext } from "@/lib/auth";
import { UserMenuClient } from "./user-menu-client";

export async function UserMenu() {
  const ctx = await getContext();
  return (
    <UserMenuClient
      name={ctx.profile.full_name}
      email={ctx.profile.email ?? ""}
      orgName={ctx.org.name}
      orgId={ctx.org.id}
      orgs={ctx.orgs.map((o) => ({ id: o.id, name: o.name }))}
    />
  );
}

export function UserMenuFallback() {
  return (
    <div className="flex h-11 items-center gap-2.5 rounded-lg px-2">
      <span className="size-8 animate-pulse rounded-full bg-black/5" />
      <span className="flex flex-col gap-1.5">
        <span className="h-2.5 w-24 animate-pulse rounded bg-black/5" />
        <span className="h-2 w-16 animate-pulse rounded bg-black/5" />
      </span>
    </div>
  );
}
