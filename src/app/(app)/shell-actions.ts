"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ORG_COOKIE, ORG_COOKIE_OPTIONS, getContext } from "@/lib/auth";

export async function switchOrganization(orgId: string) {
  const ctx = await getContext();
  if (!ctx.orgs.some((o) => o.id === orgId)) return;
  (await cookies()).set(ORG_COOKIE, orgId, ORG_COOKIE_OPTIONS);
  redirect("/");
}
