import Link from "next/link";
import { DotGlyph, LyraLogo } from "@/components/brand";
import { buttonClass } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center gap-5 overflow-hidden bg-canvas px-6 text-center">
      <div className="grid-frame pointer-events-none absolute inset-0" aria-hidden />
      <div className="relative flex flex-col items-center gap-5">
        <LyraLogo />
        <DotGlyph name="spark" tone="muted" className="size-12" />
        <h1 className="font-display text-[34px] leading-tight text-ink">
          Página não encontrada.
          <br />
          <span className="text-ink-4">O registro pode ter sido removido.</span>
        </h1>
        <Link href="/" className={buttonClass("primary", "lg")}>
          Voltar ao início
        </Link>
      </div>
    </div>
  );
}
