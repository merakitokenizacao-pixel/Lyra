"use client";

import * as React from "react";
import { Dialog as D } from "radix-ui";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export const Dialog = D.Root;
export const DialogTrigger = D.Trigger;
export const DialogClose = D.Close;

export function DialogContent({
  title,
  description,
  className,
  children,
  size = "md",
  ...props
}: React.ComponentProps<typeof D.Content> & {
  title: React.ReactNode;
  description?: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  return (
    <D.Portal>
      <D.Overlay className="fixed inset-0 z-50 bg-ink/25 backdrop-blur-[2px] data-[state=open]:animate-fade-in" />
      <D.Content
        className={cn(
          "fixed top-1/2 left-1/2 z-50 flex max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2 flex-col",
          "rounded-xl border border-line bg-panel shadow-lift outline-none data-[state=open]:animate-pop-in",
          size === "sm" && "max-w-sm",
          size === "md" && "max-w-lg",
          size === "lg" && "max-w-2xl",
          size === "xl" && "max-w-4xl",
          className,
        )}
        {...props}
      >
        <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
          <div className="min-w-0">
            <D.Title className="text-[15px] font-semibold tracking-tight text-ink">{title}</D.Title>
            {description ? (
              <D.Description className="mt-0.5 text-[13px] text-ink-3">{description}</D.Description>
            ) : (
              <D.Description className="sr-only">{typeof title === "string" ? title : "Diálogo"}</D.Description>
            )}
          </div>
          <D.Close className="-mt-1 -mr-1.5 grid size-7 shrink-0 cursor-pointer place-items-center rounded-md text-ink-3 hover:bg-hover hover:text-ink">
            <X className="size-4" />
            <span className="sr-only">Fechar</span>
          </D.Close>
        </div>
        <div className="min-h-0 overflow-y-auto">{children}</div>
      </D.Content>
    </D.Portal>
  );
}

export function DialogBody({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("flex flex-col gap-4 px-5 py-4", className)} {...props} />;
}

export function DialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("flex flex-wrap items-center justify-end gap-2 border-t border-line bg-subtle px-5 py-3 rounded-b-xl", className)}
      {...props}
    />
  );
}
