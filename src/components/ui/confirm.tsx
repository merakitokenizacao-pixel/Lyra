"use client";

import * as React from "react";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "./button";
import { Dialog, DialogBody, DialogClose, DialogContent, DialogFooter, DialogTrigger } from "./dialog";
import { useAction } from "./use-action";
import type { ActionResult } from "@/lib/utils";

export function ConfirmDialog({
  trigger,
  title,
  description,
  confirmLabel = "Excluir",
  tone = "danger",
  action,
  success,
  onDone,
  open: controlledOpen,
  onOpenChange,
}: {
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  title: string;
  description?: React.ReactNode;
  confirmLabel?: string;
  tone?: "danger" | "primary";
  action: () => Promise<ActionResult | void>;
  success?: string;
  onDone?: (result: Extract<ActionResult, { ok: true }> | undefined) => void;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;
  const { pending, run } = useAction();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DialogContent title={title} size="sm">
        {description ? (
          <DialogBody>
            <p className="text-[13px] text-ink-2">{description}</p>
          </DialogBody>
        ) : null}
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="secondary">Cancelar</Button>
          </DialogClose>
          <Button
            variant={tone === "danger" ? "danger-solid" : "primary"}
            disabled={pending}
            onClick={() =>
              run(action, {
                success,
                onSuccess: (result) => {
                  setOpen(false);
                  onDone?.(result);
                },
              })
            }
          >
            {pending ? <Loader2 className="animate-spin" /> : null}
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function SubmitButton({
  pending,
  children,
  variant = "primary",
  ...props
}: React.ComponentProps<typeof Button> & { pending?: boolean }) {
  return (
    <Button type="submit" variant={variant} disabled={pending || props.disabled} {...props}>
      {pending ? <Loader2 className="animate-spin" /> : null}
      {children}
    </Button>
  );
}
