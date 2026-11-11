import { Suspense, type ReactNode } from "react";
import { Settings } from "lucide-react";
import { PageHeader } from "@/components/shell/page-header";
import { SettingsNav, SettingsNavLinks } from "./settings-nav";

/** Configurações: menu lateral com as seções da empresa e as pessoais; cada seção é uma página. */
export default function SettingsLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <PageHeader title="Configurações" icon={<Settings />} />
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6 sm:px-6 lg:flex-row lg:gap-12 lg:py-10">
        <aside className="lg:w-52 lg:shrink-0">
          <div className="lg:sticky lg:top-[4.5rem]">
            <Suspense fallback={<SettingsNavLinks pathname={null} />}>
              <SettingsNav />
            </Suspense>
          </div>
        </aside>
        {/* Ao trocar de seção com a página rolada, o Next rola até a seção nova: a margem a mantém abaixo do cabeçalho fixo */}
        <div className="min-w-0 flex-1 [&>*]:scroll-mt-20 lg:[&>*]:scroll-mt-24">{children}</div>
      </div>
    </>
  );
}
