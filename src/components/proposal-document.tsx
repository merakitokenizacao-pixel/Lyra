import type { ReactNode } from "react";
import { BILLING_LABEL, type BillingCycle, type ProposalSection } from "@/lib/constants";
import { formatDate, formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

export type DocumentItem = {
  name: string;
  description: string | null;
  quantity: number;
  unit_price: number;
  discount_pct: number;
  billing: BillingCycle;
};

export type DocumentData = {
  number: number;
  title: string;
  organization: string;
  recipient: string | null;
  recipientDetail?: string | null;
  createdAt: string;
  validUntil: string | null;
  intro: string | null;
  sections: ProposalSection[];
  items: DocumentItem[];
  terms: string | null;
  owner?: { name: string | null; email: string | null } | null;
};

export function lineTotal(item: Pick<DocumentItem, "quantity" | "unit_price" | "discount_pct">) {
  const value = Number(item.quantity) * Number(item.unit_price) * (1 - Number(item.discount_pct) / 100);
  return Math.round(value * 100) / 100;
}

export function proposalTotals(items: DocumentItem[]) {
  return items.reduce(
    (acc, item) => {
      const total = lineTotal(item);
      if (item.billing === "monthly") acc.monthly += total;
      else acc.oneTime += total;
      return acc;
    },
    { oneTime: 0, monthly: 0 },
  );
}

/** Texto simples com suporte a listas ("- item" ou "• item"). */
export function RichText({ text, className }: { text: string; className?: string }) {
  const blocks: ReactNode[] = [];
  let bullets: string[] = [];
  let paragraph: string[] = [];
  const flushBullets = () => {
    if (bullets.length) {
      blocks.push(
        <ul key={`ul-${blocks.length}`} className="my-2 flex list-none flex-col gap-1.5 pl-0">
          {bullets.map((b, i) => (
            <li key={i} className="flex gap-2.5">
              <span className="mt-[9px] size-1 shrink-0 rounded-full bg-ink-3" aria-hidden />
              <span>{b}</span>
            </li>
          ))}
        </ul>,
      );
      bullets = [];
    }
  };
  const flushParagraph = () => {
    if (paragraph.length) {
      blocks.push(
        <p key={`p-${blocks.length}`} className="my-2">
          {paragraph.join(" ")}
        </p>,
      );
      paragraph = [];
    }
  };
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    const bullet = line.match(/^[-•*]\s+(.*)$/);
    if (bullet) {
      flushParagraph();
      bullets.push(bullet[1]);
    } else if (!line) {
      flushParagraph();
      flushBullets();
    } else {
      flushBullets();
      paragraph.push(line);
    }
  }
  flushParagraph();
  flushBullets();
  return <div className={cn("leading-relaxed", className)}>{blocks}</div>;
}

export function ProposalDocument({ data, className }: { data: DocumentData; className?: string }) {
  const totals = proposalTotals(data.items);
  const oneTime = data.items.filter((i) => i.billing !== "monthly");
  const monthly = data.items.filter((i) => i.billing === "monthly");
  // Seções sem conteúdo ficam fora do documento (e da numeração)
  const sections = data.sections.filter((s) => s.body.trim());

  return (
    <article className={cn("mx-auto w-full max-w-[820px] bg-panel text-ink", className)}>
      {/* Capa */}
      <header className="border-b border-line px-6 pt-8 pb-8 sm:px-12 sm:pt-12">
        <div className="flex flex-wrap items-center justify-between gap-3 text-[12.5px] text-ink-3">
          <span className="font-medium tracking-tight text-ink">{data.organization}</span>
          <span className="inline-flex h-6 items-center rounded-full border border-line bg-subtle px-2.5 font-mono text-[11.5px] text-ink-2">
            Proposta Nº {String(data.number).padStart(3, "0")}
          </span>
        </div>
        <h1 className="font-display mt-10 text-[34px] leading-[1.06] text-ink sm:text-[46px]">{data.title}</h1>
        <dl className="mt-8 grid grid-cols-2 gap-y-4 border-t border-line pt-5 text-[13px] sm:grid-cols-3">
          <div>
            <dt className="text-xs text-ink-3">Preparada para</dt>
            <dd className="mt-0.5 font-medium">{data.recipient ?? "—"}</dd>
            {data.recipientDetail ? <dd className="text-xs text-ink-3">{data.recipientDetail}</dd> : null}
          </div>
          <div>
            <dt className="text-xs text-ink-3">Emitida em</dt>
            <dd className="mt-0.5 font-medium">{formatDate(data.createdAt, "long")}</dd>
          </div>
          <div>
            <dt className="text-xs text-ink-3">Válida até</dt>
            <dd className="mt-0.5 font-medium">{data.validUntil ? formatDate(data.validUntil, "long") : "Sem validade definida"}</dd>
          </div>
        </dl>
      </header>

      <div className="flex flex-col gap-10 px-6 py-10 text-[14.5px] text-ink-2 sm:px-12">
        {data.intro ? <RichText text={data.intro} className="text-[15.5px] text-ink" /> : null}

        {sections.map((section, index) => (
          <section key={section.id} className="grid gap-3 sm:grid-cols-[140px_1fr] sm:gap-8">
            <h2 className="flex items-baseline gap-2 text-[13px] font-semibold text-ink">
              <span className="font-mono text-[11.5px] font-normal text-ink-4">{String(index + 1).padStart(2, "0")}</span>
              {section.title}
            </h2>
            <RichText text={section.body} className="-mt-2" />
          </section>
        ))}

        {data.items.length > 0 ? (
          <section className="grid gap-3 sm:grid-cols-[140px_1fr] sm:gap-8">
            <h2 className="flex items-baseline gap-2 text-[13px] font-semibold text-ink">
              <span className="font-mono text-[11.5px] font-normal text-ink-4">{String(sections.length + 1).padStart(2, "0")}</span>
              Investimento
            </h2>
            <div className="flex flex-col gap-6">
              {[
                { label: "Investimento único", rows: oneTime, total: totals.oneTime, suffix: "" },
                { label: "Mensalidade", rows: monthly, total: totals.monthly, suffix: "/mês" },
              ]
                .filter((group) => group.rows.length > 0)
                .map((group) => (
                  <div key={group.label} className="overflow-hidden rounded-xl border border-line">
                    <table className="w-full text-[13px]">
                      <thead>
                        <tr className="border-b border-line bg-subtle text-left text-xs text-ink-3">
                          <th className="px-4 py-2 font-medium">{group.label}</th>
                          <th className="hidden px-3 py-2 text-right font-medium sm:table-cell">Qtd.</th>
                          <th className="hidden px-3 py-2 text-right font-medium sm:table-cell">Valor unit.</th>
                          <th className="px-4 py-2 text-right font-medium">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-line">
                        {group.rows.map((item, index) => (
                          <tr key={index} className="align-top">
                            <td className="px-4 py-3">
                              <p className="font-medium text-ink">{item.name}</p>
                              {item.description ? <p className="mt-0.5 text-xs text-ink-3">{item.description}</p> : null}
                              {Number(item.discount_pct) > 0 ? (
                                <p className="mt-1 text-xs text-success">
                                  Desconto de {String(item.discount_pct).replace(".", ",")}%
                                </p>
                              ) : null}
                              <p className="mt-1 text-xs text-ink-3 sm:hidden">
                                {String(item.quantity).replace(".", ",")} × {formatMoney(item.unit_price)}
                              </p>
                            </td>
                            <td className="hidden px-3 py-3 text-right text-ink-2 tabular-nums sm:table-cell">
                              {String(item.quantity).replace(".", ",")}
                            </td>
                            <td className="hidden px-3 py-3 text-right text-ink-2 tabular-nums sm:table-cell">
                              {formatMoney(item.unit_price)}
                            </td>
                            <td className="px-4 py-3 text-right font-medium text-ink tabular-nums">
                              {formatMoney(lineTotal(item))}
                              {group.suffix}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="border-t border-line bg-subtle">
                          <td className="px-4 py-2.5 text-[13px] font-medium text-ink" colSpan={1}>
                            Subtotal · {BILLING_LABEL[group.rows[0].billing].toLowerCase()}
                          </td>
                          <td className="hidden sm:table-cell" colSpan={2} />
                          <td className="px-4 py-2.5 text-right text-[14px] font-semibold text-ink tabular-nums">
                            {formatMoney(group.total)}
                            {group.suffix}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                ))}
              <div className="flex flex-col gap-1 rounded-xl bg-ink px-5 py-4 text-white sm:flex-row sm:items-end sm:justify-between">
                <span className="text-[13px] text-white/70">Investimento total</span>
                <span className="text-right">
                  {totals.oneTime > 0 ? (
                    <span className="block text-[22px] font-semibold tracking-tight">{formatMoney(totals.oneTime)}</span>
                  ) : null}
                  {totals.monthly > 0 ? (
                    <span className={cn("block font-semibold tracking-tight", totals.oneTime > 0 ? "text-[15px] text-white/85" : "text-[22px]")}>
                      {totals.oneTime > 0 ? "+ " : ""}
                      {formatMoney(totals.monthly)}/mês
                    </span>
                  ) : null}
                </span>
              </div>
            </div>
          </section>
        ) : null}

        {data.terms ? (
          <section className="grid gap-3 sm:grid-cols-[140px_1fr] sm:gap-8">
            <h2 className="text-[13px] font-semibold text-ink">Condições</h2>
            <RichText text={data.terms} className="-mt-2 text-[13.5px]" />
          </section>
        ) : null}
      </div>

      {data.owner?.name ? (
        <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-6 py-6 text-[13px] sm:px-12">
          <span className="text-ink-3">Responsável pela proposta</span>
          <span className="text-right">
            <span className="block font-medium text-ink">{data.owner.name}</span>
            {data.owner.email ? <span className="block text-xs text-ink-3">{data.owner.email}</span> : null}
          </span>
        </footer>
      ) : null}
    </article>
  );
}
