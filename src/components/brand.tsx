import { cn } from "@/lib/utils";

/*
 * Ícone do Lyro: um "L" em matriz de pontos 5×5, na mesma grade dos ícones do app (DotGlyph),
 * com um ponto azul no canto. Os pontos seguem a cor do texto (currentColor); os apagados são
 * essa cor com pouca opacidade. Fica no favicon (src/app/icon.svg) e na proposta pública; no app
 * e nas telas de entrada a marca é só o nome (LyroLogo). Arte de referência: design/logos/1-matriz.svg.
 */
const MARK = ["#...*", "#....", "#....", "#....", "#####"];

export function LyroMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 50 50" className={cn("size-6", className)} aria-hidden>
      {MARK.flatMap((row, y) =>
        row.split("").map((cell, x) => (
          <circle
            key={`${x}-${y}`}
            cx={5 + x * 10}
            cy={5 + y * 10}
            r={cell === "." ? 1.6 : 3.8}
            fill={cell === "*" ? "var(--accent)" : "currentColor"}
            fillOpacity={cell === "." ? 0.18 : undefined}
          />
        )),
      )}
    </svg>
  );
}

/** A marca nas telas: só o nome, na serifada dos títulos. */
export function LyroLogo({ className }: { className?: string }) {
  return <span className={cn("inline-flex font-display text-[22px] leading-none text-ink", className)}>Lyro</span>;
}

/* Ícones em matriz de pontos (linguagem visual da ROX), desenhados por nós. */
const GLYPHS = {
  spark: ["..#..", "..#..", "#####", "..#..", "..#.."],
  leads: ["..#..", ".###.", "#####", ".###.", "..#.."],
  pipeline: ["#....", "##...", "###..", "####.", "#####"],
  clients: [".###.", "#...#", "#.#.#", "#...#", ".###."],
  proposals: ["####.", "#...#", "####.", "#....", "#...."],
  products: ["##.##", "##.##", ".....", "##.##", "##.##"],
  tasks: ["....#", "...##", "#.##.", "###..", ".#..."],
  chart: [".....", "...#.", ".#.#.", ".#.##", "#####"],
  funnels: ["#####", ".###.", "..#..", "..#..", "..#.."],
} as const;

export type GlyphName = keyof typeof GLYPHS;

export function DotGlyph({
  name,
  className,
  tone = "accent",
}: {
  name: GlyphName;
  className?: string;
  tone?: "accent" | "ink" | "muted";
}) {
  const rows = GLYPHS[name];
  const on = tone === "accent" ? "var(--accent)" : tone === "ink" ? "var(--ink)" : "var(--ink-4)";
  return (
    <svg viewBox="0 0 50 50" className={cn("size-10", className)} aria-hidden>
      {rows.flatMap((row, y) =>
        row.split("").map((cell, x) => (
          <circle
            key={`${x}-${y}`}
            cx={5 + x * 10}
            cy={5 + y * 10}
            r={cell === "#" ? 3.4 : 1.6}
            fill={cell === "#" ? on : "var(--line-strong)"}
          />
        )),
      )}
    </svg>
  );
}
