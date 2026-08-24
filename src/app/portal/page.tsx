import Link from "next/link";
import { redirect } from "next/navigation";
import { PortalShell } from "@/components/PortalShell";
import { Button, Card, Label, Section, Stat } from "@/components/ui";
import { SpeakButton } from "@/components/SpeakButton";
import { currentMember } from "@/lib/session";
import { personaFor } from "@/lib/data/personas";
import { profileHealth } from "@/lib/engine/preflight";
import { buildPassbook, summarise } from "@/lib/passbook";
import { formatRupees } from "@/lib/engine/dates";
import { t } from "@/lib/i18n";
import { readLocale } from "@/lib/locale";

export default async function Dashboard({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const member = await currentMember();
  if (!member) redirect("/login");

  const sp = await searchParams;
  const locale = readLocale(sp);
  const asOf = new Date().toISOString().slice(0, 10);
  const persona = personaFor(member.uan);
  const displayName = persona?.name ?? member.epfoName;

  const health = profileHealth(member, asOf);
  const years = buildPassbook(member, asOf);
  const money = summarise(years);
  const recent = years[0]?.rows.slice(-3).reverse() ?? [];
  const lastSpell = member.spells[member.spells.length - 1];

  const headline = health.clean
    ? t(locale, "dash.clean")
    : health.blockers > 0
      ? locale === "hi"
        ? `${health.blockers} चीज़ें किसी भी क्लेम को रोक देंगी।`
        : `${health.blockers} thing${health.blockers > 1 ? "s" : ""} will block any claim you file.`
      : locale === "hi"
        ? `${health.risks} चीज़ों से पैसा या समय जाएगा।`
        : `${health.risks} thing${health.risks > 1 ? "s" : ""} will cost you money or time.`;

  const actions = [
    { href: `/portal/claim?lang=${locale}`, h: "dash.a1h", b: "dash.a1b", primary: true },
    { href: `/portal/passbook?lang=${locale}`, h: "dash.a2h", b: "dash.a2b" },
    { href: `/portal/records?lang=${locale}`, h: "dash.a3h", b: "dash.a3b" },
    { href: `/portal/claims?lang=${locale}`, h: "dash.a4h", b: "dash.a4b" },
  ];

  return (
    <PortalShell locale={locale} name={displayName} uan={member.uan} active="/portal">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h1 className="text-[1.35rem] font-bold leading-tight tracking-tight">
          {locale === "hi" ? "नमस्ते" : "Namaste"}, {displayName.split(" ")[0]}
        </h1>
        <p className="text-[0.8rem] text-ink-faint">
          {t(locale, lastSpell?.doe ? "dash.lastWorked" : "dash.currentlyAt")}{" "}
          <span className="font-medium text-ink-soft">{lastSpell?.employerName ?? "—"}</span>
        </p>
      </div>

      <Card className="mt-4 p-5">
        <Stat label={t(locale, "dash.balance")} value={formatRupees(money.epfBalance)} size="lg" />
        <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 border-t border-line pt-3.5 sm:grid-cols-3">
          <Stat label={t(locale, "dash.pensionFund")} value={formatRupees(money.pensionFundTotal)} size="sm" />
          <Stat label={t(locale, "dash.interest")} value={formatRupees(money.totalInterest)} size="sm" />
          <Stat label={t(locale, "dash.years")} value={String(years.length)} size="sm" />
        </dl>
      </Card>

      {money.missingAmount > 0 && (
        <div className="mt-3 flex overflow-hidden rounded-[--radius-card] border border-line bg-card">
          <div className="w-[3px] shrink-0 bg-stop" aria-hidden />
          <div className="min-w-0 flex-1 p-5">
            <p className="text-[0.7rem] font-bold uppercase tracking-[0.09em] text-stop">
              {t(locale, "dash.missingTitle")}
            </p>
            <p className="mt-1.5 text-[1.75rem] font-bold leading-none tracking-tight tabular-nums text-ink">
              {formatRupees(money.missingAmount)}
            </p>
            <p className="mt-2 text-[0.88rem] leading-relaxed text-ink-soft">
              {money.missingMonths.length} {t(locale, "dash.months")}:{" "}
              {money.missingMonths.join(", ")}. {t(locale, "dash.missingBody")}
            </p>
            <Link
              href={`/portal/passbook?lang=${locale}`}
              className="mt-2.5 inline-block text-[0.85rem] font-semibold text-brand underline decoration-brand/40 underline-offset-4"
            >
              {t(locale, "dash.missingCta")} →
            </Link>
          </div>
        </div>
      )}

      <div className="mt-3 flex overflow-hidden rounded-[--radius-card] border border-line bg-card">
        <div
          className={`w-[3px] shrink-0 ${
            health.clean ? "bg-go" : health.blockers > 0 ? "bg-stop" : "bg-warn"
          }`}
          aria-hidden
        />
        <div className="min-w-0 flex-1 p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <Label>{t(locale, "dash.record")}</Label>
            <SpeakButton
              text={headline}
              locale={locale}
              label={locale === "hi" ? "सुनें" : "Listen"}
            />
          </div>
          <p className="mt-1.5 text-[1.05rem] font-bold leading-snug text-ink">{headline}</p>
          <p className="mt-1.5 text-[0.88rem] leading-relaxed text-ink-soft">
            {health.clean ? t(locale, "dash.cleanBody") : t(locale, "dash.notClean")}
          </p>
          <p className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-[0.78rem]">
            {health.blockers > 0 && (
              <span className="font-bold text-stop">
                {health.blockers} {t(locale, "dash.blocking")}
              </span>
            )}
            {health.risks > 0 && (
              <span className="font-bold text-warn">
                {health.risks} {t(locale, "dash.costly")}
              </span>
            )}
            {health.advisories > 0 && (
              <span className="font-bold text-note">
                {health.advisories} {t(locale, "dash.toNote")}
              </span>
            )}
            <span className="text-ink-faint">
              {health.passed.length} {t(locale, "dash.passing")}
            </span>
          </p>
          <Button href={`/portal/records?lang=${locale}`} className="mt-3.5">
            {t(locale, health.clean ? "dash.seeChecks" : "dash.fixRecords")} →
          </Button>
        </div>
      </div>

      <Section title={t(locale, "dash.whatDo")}>
        <div className="grid gap-3 sm:grid-cols-2">
          {actions.map((a) => (
            <Link
              key={a.href}
              href={a.href}
              className={`block rounded-[--radius-card] border p-4 ${
                a.primary ? "border-brand/25 bg-brand-wash" : "border-line bg-card"
              }`}
            >
              <span className="block font-bold leading-snug text-ink">{t(locale, a.h)}</span>
              <span className="mt-1 block text-[0.84rem] leading-snug text-ink-soft">
                {t(locale, a.b)}
              </span>
            </Link>
          ))}
        </div>
      </Section>

      {recent.length > 0 && (
        <Section title={t(locale, "dash.recent")}>
          <Card>
            <ul className="divide-y divide-line">
              {recent.map((r) => (
                <li
                  key={r.month}
                  className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 px-4 py-3"
                >
                  <div>
                    <p className="font-medium tabular-nums text-ink">{r.month}</p>
                    <p className="text-[0.78rem] text-ink-faint">{r.employerName}</p>
                  </div>
                  {r.missing ? (
                    <span className="text-[0.82rem] font-bold text-stop">
                      {t(locale, "dash.nothingReceived")}
                    </span>
                  ) : (
                    <span className="text-[0.92rem] font-semibold tabular-nums text-ink">
                      {formatRupees(r.employeeShare + r.employerShare + r.pensionShare)}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </Card>
        </Section>
      )}
    </PortalShell>
  );
}
