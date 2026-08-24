import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PortalShell } from "@/components/PortalShell";
import { CopyBlock } from "@/components/CopyBlock";
import { currentMember } from "@/lib/session";
import { personaFor } from "@/lib/data/personas";
import { needById } from "@/lib/needs";
import { preflight, profileHealth } from "@/lib/engine/preflight";
import { generateDocument, type DocumentKind } from "@/lib/documents";
import { localiseFinding } from "@/lib/i18n/localise";
import type { AdvancePurpose, ClaimIntent } from "@/lib/engine/types";
import { t } from "@/lib/i18n";
import { one, readLocale } from "@/lib/locale";

export default async function FixPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const member = await currentMember();
  if (!member) redirect("/login");

  const sp = await searchParams;
  const locale = readLocale(sp);
  const need = needById(one(sp.need) ?? "left-job");
  const ruleId = one(sp.rule);
  if (!need || !ruleId) notFound();

  const persona = personaFor(member.uan);
  const asOf = new Date().toISOString().slice(0, 10);
  const claim: ClaimIntent = {
    type: need.claimType,
    purpose: need.needsPurpose ? (one(sp.purpose) as AdvancePurpose | undefined) : undefined,
    requestedAmount: need.needsAmount ? Number(one(sp.amount) ?? 0) || undefined : undefined,
    asOf,
  };

  // A finding reached from the records page is not tied to a claim, so fall back
  // to the record-level check rather than failing.
  const found =
    preflight(member, claim).findings.find((f) => f.ruleId === ruleId) ??
    profileHealth(member, asOf).findings.find((f) => f.ruleId === ruleId);
  if (!found) notFound();
  const finding = localiseFinding(found, locale);

  const kinds = [...new Set(finding.repair.map((r) => r.generates).filter(Boolean))] as DocumentKind[];
  if (kinds.length === 0) notFound();

  const docs = kinds.map((k) => generateDocument(k, member, finding, asOf));
  const q = `need=${need.id}&lang=${locale}${claim.purpose ? `&purpose=${claim.purpose}` : ""}${
    claim.requestedAmount ? `&amount=${claim.requestedAmount}` : ""
  }`;

  return (
    <PortalShell
      locale={locale}
      name={persona?.name ?? member.epfoName}
      uan={member.uan}
      active="/portal/claim"
    >
      <Link
        href={`/portal/claim/check?${q}`}
        className="text-[0.85rem] font-medium text-ink-soft"
      >
        ← Back to the check
      </Link>

      <h1 className="mt-3 text-[1.35rem] font-bold leading-tight tracking-tight text-balance">
        {finding.title}
      </h1>
      <p className="mt-2 text-[0.92rem] leading-relaxed text-ink-soft">{finding.why}</p>

      {docs.map((doc) => (
        <section key={doc.kind} className="mt-7">
          <h2 className="text-[1.08rem] font-bold leading-snug text-ink">{doc.title}</h2>
          <p className="mt-1 text-[0.85rem] text-ink-faint">
            <span className="font-semibold">Goes to: </span>
            {doc.audience}
          </p>

          <div className="mt-4 rounded-[--radius-card] border border-line bg-brand-wash p-4">
            <h3 className="text-[0.7rem] font-bold uppercase tracking-[0.09em] text-brand-ink">
              How to get this to the right person
            </h3>
            <ol className="mt-2 space-y-2">
              {doc.delivery.map((d, i) => (
                <li key={i} className="flex gap-2.5 text-[0.88rem] leading-relaxed text-ink">
                  <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-card text-[0.72rem] font-bold tabular-nums text-brand-ink">
                    {i + 1}
                  </span>
                  {d}
                </li>
              ))}
            </ol>
            {doc.keep && (
              <p className="mt-3 border-t border-line pt-2.5 text-[0.85rem] leading-relaxed text-brand-ink">
                <span className="font-semibold">Keep this: </span>
                {doc.keep}
              </p>
            )}
          </div>

          <div className="mt-4">
            <CopyBlock text={doc.body} label="Copy this text" />
          </div>
        </section>
      ))}

      <p className="mt-8 rounded-[--radius-card] border border-line bg-card p-4 text-[0.82rem] leading-relaxed text-ink-faint">
        <span className="font-semibold text-ink">
          {locale === "hi" ? "इन काग़ज़ों के बारे में। " : "On these drafts. "}
        </span>
        {locale === "hi" &&
          "चिट्ठियाँ जान-बूझकर अंग्रेज़ी में हैं — ईपीएफ़ओ के दफ़्तर और नियोक्ता अंग्रेज़ी अर्ज़ियों पर तेज़ी से काम करते हैं। समझाना आपकी भाषा में है, अर्ज़ी उनकी भाषा में। "}
        They are filled from templates, not written by a language model. A
        declaration with an invented field, or a grievance citing a paragraph that
        does not exist, is worse than none — it is rejected, and the member loses
        three more weeks finding out. Check your own details before you sign, and
        take advice if the amount matters to you.
      </p>

      <Link
        href={`/portal/claim/check?${q}`}
        className="mt-6 block rounded-lg border border-line-strong px-4 py-3.5 text-center font-semibold text-ink"
      >
        {t(locale, "nav.back")}
      </Link>
    </PortalShell>
  );
}
