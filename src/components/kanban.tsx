"use client";

import { useId, useRef, useState, type ReactNode } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { cn } from "@/lib/utils";

export type KanbanColumn = {
  id: string;
  header: ReactNode;
  tone?: "default" | "won" | "lost";
};

type Props<T extends { id: string }> = {
  columns: KanbanColumn[];
  items: T[];
  getColumnId: (item: T) => string;
  renderCard: (item: T) => ReactNode;
  onMove: (item: T, toColumnId: string) => void;
  emptyText?: string;
  /** Classes extras da área que rola (ex.: lg:px-page para seguir a largura fixa da página) */
  className?: string;
};

export function Kanban<T extends { id: string }>({ columns, items, getColumnId, renderCard, onMove, emptyText, className }: Props<T>) {
  // id estável entre servidor e cliente (sem ele o dnd-kit usa um contador global e a hidratação diverge)
  const dndId = useId();
  const [activeId, setActiveId] = useState<string | null>(null);
  const justDragged = useRef(false);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor),
  );

  const active = activeId ? items.find((i) => i.id === activeId) : undefined;

  function handleStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  function handleEnd(event: DragEndEvent) {
    setActiveId(null);
    justDragged.current = true;
    setTimeout(() => (justDragged.current = false), 80);
    const item = items.find((i) => i.id === String(event.active.id));
    const to = event.over?.id ? String(event.over.id) : null;
    if (!item || !to || getColumnId(item) === to) return;
    onMove(item, to);
  }

  return (
    <DndContext
      id={dndId}
      sensors={sensors}
      onDragStart={handleStart}
      onDragEnd={handleEnd}
      onDragCancel={() => setActiveId(null)}
      accessibility={{
        screenReaderInstructions: {
          draggable: "Pressione espaço para pegar o card, use as setas para mover e espaço novamente para soltar.",
        },
      }}
    >
      {/* relative: os textos sr-only dos cards (position: absolute) ficam presos nesta área que rola.
          Sem isso eles escapam do recorte e esticam a página na horizontal. */}
      <div
        className={cn("relative flex min-h-0 flex-1 gap-3 overflow-x-auto px-4 pt-4 pb-6 sm:px-6", className)}
        onClickCapture={(e) => {
          if (justDragged.current) {
            e.preventDefault();
            e.stopPropagation();
          }
        }}
      >
        {columns.map((column) => {
          const columnItems = items.filter((i) => getColumnId(i) === column.id);
          return (
            <Column key={column.id} column={column} empty={columnItems.length === 0} emptyText={emptyText}>
              {columnItems.map((item) => (
                <DraggableCard key={item.id} id={item.id} dimmed={item.id === activeId}>
                  {renderCard(item)}
                </DraggableCard>
              ))}
            </Column>
          );
        })}
      </div>
      <DragOverlay dropAnimation={{ duration: 160, easing: "cubic-bezier(0.16, 1, 0.3, 1)" }}>
        {active ? <div className="rotate-[1.5deg] cursor-grabbing shadow-lift rounded-lg">{renderCard(active)}</div> : null}
      </DragOverlay>
    </DndContext>
  );
}

function Column({
  column,
  children,
  empty,
  emptyText = "Arraste cards para cá",
}: {
  column: KanbanColumn;
  children: ReactNode;
  empty: boolean;
  emptyText?: string;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });
  return (
    <section
      ref={setNodeRef}
      className={cn(
        "flex w-[284px] shrink-0 flex-col rounded-xl border bg-subtle transition-colors",
        isOver ? "border-accent/40 bg-accent-soft/50" : "border-line",
      )}
    >
      <header className="px-3 pt-3 pb-2">{column.header}</header>
      <div className="flex min-h-24 flex-1 flex-col gap-2 px-2 pb-2">
        {children}
        {empty ? (
          <div className="grid flex-1 place-items-center rounded-lg border border-dashed border-line-strong/70 px-3 py-6 text-center text-xs text-ink-4">
            {emptyText}
          </div>
        ) : null}
      </div>
    </section>
  );
}

function DraggableCard({ id, children, dimmed }: { id: string; children: ReactNode; dimmed: boolean }) {
  const { attributes, listeners, setNodeRef } = useDraggable({ id });
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={cn(
        "cursor-grab touch-manipulation rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-accent/50 active:cursor-grabbing",
        dimmed && "opacity-40",
      )}
    >
      {children}
    </div>
  );
}
