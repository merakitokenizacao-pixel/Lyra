import Link from "next/link";
import { ACTIVITY_TYPES, type ActivityType } from "@/lib/constants";
import { formatDateTime, formatRelative, isOverdue } from "@/lib/format";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/ui/misc";
import { DotGlyph } from "@/components/brand";
import { ActivityActions, TaskCheck } from "./task-check";

export type TimelineActivity = {
  id: string;
  type: ActivityType;
  title: string | null;
  body: string | null;
  due_at: string | null;
  completed_at: string | null;
  created_at: string;
  author?: string | null;
  subject?: { label: string; href: string } | null;
};

const MANUAL: ActivityType[] = ["note", "call", "email", "meeting", "whatsapp", "task"];

export function Timeline({
  activities,
  emptyText = "Nenhuma atividade ainda. Registre a primeira interação acima.",
  compact = false,
}: {
  activities: TimelineActivity[];
  emptyText?: string;
  compact?: boolean;
}) {
  if (activities.length === 0) {
    return <EmptyState icon={<DotGlyph name="spark" tone="muted" className="size-8" />} title="Linha do tempo vazia" description={emptyText} />;
  }

  return (
    <ol className="relative">
      {activities.map((activity, index) => {
        const meta = ACTIVITY_TYPES[activity.type];
        const Icon = meta.icon;
        const isTask = activity.type === "task";
        const done = Boolean(activity.completed_at);
        const overdue = isTask && !done && isOverdue(activity.due_at);
        const automatic = !MANUAL.includes(activity.type);
        return (
          <li key={activity.id} className="group relative flex gap-3 pb-5 last:pb-1">
            {index < activities.length - 1 ? (
              <span className="absolute top-8 bottom-0 left-[15px] w-px bg-line" aria-hidden />
            ) : null}
            <span
              className={cn(
                "relative z-10 grid size-8 shrink-0 place-items-center rounded-full border",
                automatic ? "border-line bg-subtle text-ink-4" : "border-line bg-panel text-ink-2 shadow-xs",
              )}
            >
              <Icon className="size-3.5" />
            </span>
            <div className="min-w-0 flex-1 pt-1">
              <div className="flex items-start gap-2">
                {isTask ? <TaskCheck id={activity.id} done={done} /> : null}
                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      "text-[13px] leading-snug",
                      automatic ? "text-ink-2" : "font-medium text-ink",
                      done && "text-ink-3 line-through",
                    )}
                  >
                    {activity.title ?? meta.label}
                  </p>
                  {activity.body && !compact ? (
                    <p className="mt-1 text-[13px] leading-relaxed whitespace-pre-wrap text-ink-2">{activity.body}</p>
                  ) : null}
                  <p className="mt-1 flex flex-wrap items-center gap-x-1.5 text-xs text-ink-3">
                    {!automatic ? <span>{meta.label}</span> : null}
                    {!automatic && activity.author ? <span aria-hidden>·</span> : null}
                    {activity.author ? <span>{activity.author}</span> : null}
                    <span aria-hidden>·</span>
                    <time dateTime={activity.created_at} title={formatDateTime(activity.created_at)}>
                      {formatRelative(activity.created_at)}
                    </time>
                    {isTask && activity.due_at ? (
                      <>
                        <span aria-hidden>·</span>
                        <span className={cn(overdue && "font-medium text-danger")}>
                          {overdue ? "Atrasada · " : "Prazo "}
                          {formatDateTime(activity.due_at)}
                        </span>
                      </>
                    ) : null}
                    {activity.subject ? (
                      <>
                        <span aria-hidden>·</span>
                        <Link href={activity.subject.href} className="font-medium text-ink-2 hover:text-accent">
                          {activity.subject.label}
                        </Link>
                      </>
                    ) : null}
                  </p>
                </div>
                {!automatic ? <ActivityActions id={activity.id} /> : null}
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
