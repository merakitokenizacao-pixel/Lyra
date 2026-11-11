"use client";

import * as React from "react";
import { Tooltip as T } from "radix-ui";
import { cn } from "@/lib/utils";

export const TooltipProvider = T.Provider;
export const Tooltip = T.Root;
export const TooltipTrigger = T.Trigger;

export function TooltipContent({ className, sideOffset = 8, ...props }: React.ComponentProps<typeof T.Content>) {
  return (
    <T.Portal>
      <T.Content
        sideOffset={sideOffset}
        className={cn(
          "z-50 rounded-md bg-ink px-2 py-1 text-xs font-medium text-white shadow-pop select-none data-[state=delayed-open]:animate-fade-in",
          className,
        )}
        {...props}
      />
    </T.Portal>
  );
}
