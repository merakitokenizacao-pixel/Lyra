import { CLIENT_STATUSES, type ClientStatus } from "@/lib/constants";
import { DotBadge } from "@/components/ui/badge";

export function ClientStatusBadge({ status, className }: { status: ClientStatus; className?: string }) {
  const meta = CLIENT_STATUSES[status];
  return (
    <DotBadge color={meta.color} className={className}>
      {meta.label}
    </DotBadge>
  );
}
