import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PortalShell } from "@/components/PortalShell";
import { FindingCard } from "@/components/FindingCard";
import { SpeakButton } from "@/components/SpeakButton";
import { Card, Stat } from "@/components/ui";
import { currentMember } from "@/lib/session";
import { personaFor } from "@/lib/data/personas";
import { needById } from "@/lib/needs";
import { preflight, amountAtStake } from "@/lib/engine/preflight";
import { localiseFindings } from "@/lib/i18n/localise";
import { formatRupees } from "@/lib/engine/dates";
import type { AdvancePurpose, Actor, ClaimIntent, Finding } from "@/lib/engine/types";
import { t } from "@/lib/i18n";
import { one, readLocale } from "@/lib/locale";

const VERDICT = {
  GO: { key: "go", rule: "bg-go" },
  FIX_FIRST: { key: "fix", rule: "bg-stop" },
  NOT_ELIGIBLE: { key: "notEligible", rule: "bg-note" },
} as const;

export default async function CheckPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const member = await currentMember();
  if (!member) redirect("/login");

  const sp = await searchParams;
  const locale = readLocale(sp);
  const need = needById(one(sp.need) ?? "");
  if (!need) notFound();

  const persona = personaFor(member.uan);
  const claim: ClaimIntent = {
    type: need.claimType,
    purpose: need.needsPurpose ? (one(sp.purpose) as AdvancePurpose | undefined) : undefined,
    requestedAmount: need.needsAmount ? Number(one(sp.amount) ?? 0) || undefined : undefined,
    asOf: new Date().toISOString().slice(0, 10),
  };

  const raw = preflight(member, claim);
  // Findings arrive in English from the engine; render them in the member's language.
  const result = { ...raw, findings: localiseFindings(raw.findings, locale) };
  const style = VERDICT[result.verdict];

  const bySeverity = (s: Finding["severity"]) => result.findings.filter((f) => f.severity === s);
  const groups = [
    { heading: t(locale, "check.blockers"), items: bySeverity("BLOCKER") },
    { heading: t(locale, "check.risks"), items: bySeverity("RISK") },
    { heading: t(locale, "check.advisories"), items: bySeverity("ADVISORY") },
  ].filter((g) => g.items.length > 0);

  const actors = (["MEMBER", "EMPLOYER", "BANK", "EPFO"] as Actor[])
    .map((a) => ({
      actor: a,
      count: result.findings.filter((f) => f.actor === a && f.severity !== "ADVISORY").length,
    }))
    .filter((x) => x.count > 0);

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
        href={`/portal/claim?lang=${locale}${need.needsPurpose ? `&need=${need.id}` : ""}`}
        className="text-[0.85rem] font-medium text-ink-soft"
      >
        ← {t(locale, "nav.back")}
      </Link>

      <p className="mt-3 text-[0.7rem] font-semibold uppercase tracking-[0.09em] text-ink-faint">
        {t(locale, "check.title")} &middot; {need.formName}
      </p>

      <section
        className="mt-2 flex overflow-hidden rounded-[--radius-card] border border-line bg-card"
        aria-live="polite"
      >
        <div className={`w-[3px] shrink-0 ${style.rule}`} aria-hidden />
        <div className="min-w-0 flex-1 p-5">
          <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
            <h1 className="text-[1.3rem] font-bold leading-tight tracking-tight text-balance">
              {t(locale, `check.${style.key}.title`)}
            </h1>
            <SpeakButton
              locale={locale}
              label="Read this to me"
              text={[
                t(locale, `check.${style.key}.title`),
                t(locale, `check.${style.key}.body`),
                ...result.findings.map((f) => `${f.title}. ${f.why}`),
              ].join(" ")}
            />
          </div>

          <p className="mt-2 text-[0.9rem] leading-relaxed text-ink-soft">
            {t(locale, `check.${style.key}.body`)}
          </p>

          <dl className="mt-4 flex flex-wrap gap-x-8 gap-y-3 border-t border-line pt-3.5">
            <Stat label={t(locale, "check.atStake")} value={formatRupees(amountAtStake(member, claim))} />
            <Stat
              label={t(locale, "check.readyIn")}
              value={
                result.estimatedDaysToReady === 0
                  ? t(locale, "check.today")
                  : `${result.estimatedDaysToReady} ${t(locale, "check.days")}`
              }
            />
            <Stat
              label={t(locale, "check.checksRun")}
              value={String(result.passed.length + result.findings.length)}
            />
          </dl>
        </div>
      </section>

      {actors.length > 0 && (
        <Card className="mt-4 p-4">
          <h2 className="text-[0.7rem] font-semibold uppercase tracking-[0.09em] text-ink-faint">
            {t(locale, "check.waitingOn")}
          </h2>
          <ul className="mt-2.5 space-y-1.5">
            {actors.map(({ actor, count }) => (
              <li key={actor} className="flex items-baseline justify-between gap-4 text-[0.92rem]">
                <span className="font-medium text-ink">{t(locale, `actor.${actor}`)}</span>
                <span className="tabular-nums text-ink-soft">
                  {count} {t(locale, count === 1 ? "check.thing" : "check.things")}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-3 border-t border-line pt-2.5 text-[0.8rem] leading-relaxed text-ink-faint">
            {t(locale, "check.waitingNote")}
          </p>
        </Card>
      )}

      {groups.map((g) => (
        <section key={g.heading} className="mt-7">
          <h2 className="text-[0.7rem] font-semibold uppercase tracking-[0.09em] text-ink-faint">
            {g.heading} &middot; {g.items.length}
          </h2>
          <div className="mt-3 space-y-4">
            {g.items.map((f) => (
              <FindingCard
                key={f.ruleId}
                finding={f}
                locale={locale}
                href={`/portal/claim/fix?${q}&rule=${f.ruleId}`}
              />
            ))}
          </div>
        </section>
      ))}

      {result.verdict === "GO" && (
        <Link
          href={`/portal/claim/file?${q}`}
          className="mt-6 block rounded-lg bg-brand px-4 py-3.5 text-center text-[1.05rem] font-semibold text-white"
        >
          {t(locale, "check.fileIt")} →
        </Link>
      )}

      <details className="mt-6 rounded-[--radius-card] border border-line bg-card">
        <summary className="cursor-pointer px-4 py-3 text-[0.88rem] font-medium text-ink">
          {t(locale, "check.passedShow")} &middot; {result.passed.length}{" "}
          {t(locale, "check.passed")}
        </summary>
        <ul className="space-y-1.5 border-t border-line px-4 py-3">
          {result.passed.map((label) => (
            <li key={label} className="flex gap-2 text-[0.85rem] text-ink-soft">
              <span aria-hidden className="text-go">✓</span>
              {label}
            </li>
          ))}
        </ul>
        <p className="border-t border-line px-4 py-3 text-[0.78rem] leading-relaxed text-ink-faint">
          Every check is a written rule with a scheme paragraph behind it, and it
          either fired or it did not. Nothing on this page was decided by a
          language model.
        </p>
      </details>
    </PortalShell>
  );
}
