import Link from "next/link";
import { redirect } from "next/navigation";
import { PortalShell } from "@/components/PortalShell";
import { CopyBlock } from "@/components/CopyBlock";
import { currentMember } from "@/lib/session";
import { personaFor } from "@/lib/data/personas";
import { needById } from "@/lib/needs";
import { amountAtStake } from "@/lib/engine/preflight";
import { formatRupees } from "@/lib/engine/dates";
import { delayGrievance } from "@/lib/documents";
import type { AdvancePurpose, ClaimIntent } from "@/lib/engine/types";
import { STAGES, SLA_DAYS, claimState, makeReference, slaStatus } from "@/lib/tracking";
import { t } from "@/lib/i18n";
import { one, readLocale } from "@/lib/locale";

/** Day counts the prototype can jump to, so the delay case is demonstrable. */
const JUMPS = [0, 6, 13, 27];

export default async function ClaimsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const member = await currentMember();
  if (!member) redirect("/login");

  const sp = await searchParams;
  const locale = readLocale(sp);
  const persona = personaFor(member.uan);
  const need = needById(one(sp.need) ?? "");

  // Nothing filed in this session. Say so plainly rather than inventing history.
  if (!need) {
    return (
      <PortalShell
        locale={locale}
        name={persona?.name ?? member.epfoName}
        uan={member.uan}
        active="/portal/claims"
      >
        <h1 className="text-[1.4rem] font-bold leading-tight tracking-tight">{t(locale, "trk.title")}</h1>
        <p className="mt-2 text-[0.94rem] leading-relaxed text-ink-soft">
          {t(locale, "trk.empty")}
        </p>
        <Link
          href={`/portal/claim?lang=${locale}`}
          className="mt-5 inline-block rounded-lg bg-brand px-4 py-3.5 text-[1rem] font-semibold text-white"
        >
          {t(locale, "trk.checkClaim")} →
        </Link>
      </PortalShell>
    );
  }

  const day = Math.max(0, Number(one(sp.day) ?? 0) || 0);
  const claim: ClaimIntent = {
    type: need.claimType,
    purpose: need.needsPurpose ? (one(sp.purpose) as AdvancePurpose | undefined) : undefined,
    requestedAmount: need.needsAmount ? Number(one(sp.amount) ?? 0) || undefined : undefined,
    asOf: new Date().toISOString().slice(0, 10),
  };

  const reference = makeReference(member.uan, need.claimType);
  const { stageIndex: current, stalled } = claimState(day);
  const sla = slaStatus(day);
  const amount = amountAtStake(member, claim);
  const settled = !stalled && STAGES[current].id === "SETTLED";

  const base = `/portal/claims?need=${need.id}&lang=${locale}${
    claim.purpose ? `&purpose=${claim.purpose}` : ""
  }${claim.requestedAmount ? `&amount=${claim.requestedAmount}` : ""}`;

  const escalation = delayGrievance(member, {
    reference,
    daysElapsed: day,
    formName: need.formName,
    amount,
    asOf: claim.asOf,
  });

  return (
    <PortalShell
      locale={locale}
      name={persona?.name ?? member.epfoName}
      uan={member.uan}
      active="/portal/claims"
    >
      <p className="text-[0.7rem] font-semibold uppercase tracking-[0.09em] text-ink-faint">
        {need.formName}
      </p>
      <h1 className="mt-1 text-[1.4rem] font-bold leading-tight tracking-tight">
        {t(locale, settled ? "trk.settled" : "trk.withEpfo")}
      </h1>
      <p className="mt-1 font-mono text-[0.85rem] text-ink-soft">{reference}</p>

      <section
        className={`mt-5 rounded-[--radius-card] border p-5 ${
          settled
            ? "border-go/50 bg-sunken"
            : sla.breached
              ? "border-stop/50 bg-sunken"
              : "border-line bg-card"
        }`}
      >
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="font-semibold text-ink">
            {settled
              ? `${t(locale, "trk.settledOn")} ${day}`
              : sla.breached
                ? `${sla.daysOver} ${t(locale, "trk.pastDeadline")}`
                : `${t(locale, "trk.dayOf")} ${day} ${t(locale, "trk.of")} ${SLA_DAYS}`}
          </h2>
          <span className="text-[0.95rem] font-bold tabular-nums text-ink">
            {formatRupees(amount)}
          </span>
        </div>

        <div
          className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-line"
          role="img"
          aria-label={`${day} of ${SLA_DAYS} working days elapsed`}
        >
          <div
            className={`h-full rounded-full ${
              settled ? "bg-go" : sla.breached ? "bg-stop" : "bg-brand"
            }`}
            style={{ width: `${Math.min(100, (day / SLA_DAYS) * 100)}%` }}
          />
        </div>

        <p className="mt-3 text-[0.88rem] leading-relaxed text-ink-soft">
          {settled
            ? t(locale, "trk.settledBody")
            : sla.breached
              ? t(locale, "trk.breachedBody")
              : `${t(locale, "trk.onTrackLead")} ${sla.daysRemaining} ${t(locale, "trk.onTrackBody")}`}
        </p>
      </section>

      <ol className="mt-6">
        {STAGES.map((s, i) => {
          const state = i < current ? "done" : i === current ? "now" : "todo";
          return (
            <li key={s.id} className="flex gap-3.5">
              <div className="flex flex-col items-center">
                <span
                  aria-hidden
                  className={`flex size-6 shrink-0 items-center justify-center rounded-full border-2 text-[0.7rem] font-bold ${
                    state === "done"
                      ? "border-go bg-go text-white"
                      : state === "now"
                        ? "border-brand bg-brand text-white"
                        : "border-line-strong bg-card text-ink-faint"
                  }`}
                >
                  {state === "done" ? "✓" : i + 1}
                </span>
                {i < STAGES.length - 1 && (
                  <span
                    className={`w-0.5 flex-1 ${i < current ? "bg-go" : "bg-line"}`}
                    style={{ minHeight: "1.5rem" }}
                  />
                )}
              </div>

              <div className={`pb-6 ${state === "todo" ? "opacity-55" : ""}`}>
                <p className="font-semibold leading-snug text-ink">{locale === "hi" ? s.epfoLabelHi : s.epfoLabel}</p>
                {state === "now" && !settled && (
                  <p className="mt-0.5 text-[0.7rem] font-bold uppercase tracking-[0.09em] text-brand">
                    {t(locale, "trk.hereNow")}
                  </p>
                )}
                <p className="mt-1 text-[0.88rem] leading-relaxed text-ink-soft">{locale === "hi" ? s.plainHi : s.plain}</p>
                {s.desk !== "—" && (
                  <p className="mt-1 text-[0.78rem] text-ink-faint">
                    <span className="font-semibold">{t(locale, "trk.heldBy")} </span>
                    {locale === "hi" ? s.deskHi : s.desk}
                    {s.typicalDays > 0 &&
                      ` · ${t(locale, "trk.usually")} ${s.typicalDays} ${t(locale, s.typicalDays === 1 ? "trk.workingDay" : "trk.workingDays")}`}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      {sla.breached && !settled && (
        <section className="rounded-[--radius-card] border border-stop/45 bg-card p-4">
          <h2 className="text-[1.05rem] font-bold leading-snug text-ink">
            {t(locale, "trk.escalationReady")}
          </h2>
          <p className="mt-1.5 text-[0.88rem] leading-relaxed text-ink-soft">
            {escalation.audience}
          </p>
          <ol className="mt-3 space-y-2">
            {escalation.delivery.map((d, i) => (
              <li key={i} className="flex gap-2.5 text-[0.88rem] leading-relaxed text-ink">
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-brand-wash text-[0.72rem] font-bold tabular-nums text-brand-ink">
                  {i + 1}
                </span>
                {d}
              </li>
            ))}
          </ol>
          <div className="mt-4">
            <CopyBlock text={escalation.body} label={t(locale, "trk.copyLetter")} />
          </div>
          <p className="mt-2.5 text-[0.78rem] leading-relaxed text-ink-faint">
            {locale === "hi"
              ? "चिट्ठी जान-बूझकर अंग्रेज़ी में है। ईपीएफ़ओ के दफ़्तर अंग्रेज़ी में दी गई अर्ज़ियों पर तेज़ी से काम करते हैं — समझाना आपकी भाषा में, अर्ज़ी उनकी भाषा में।"
              : "The letter is in English on purpose. EPFO offices act faster on English submissions — the explanation is in your language, the submission is in theirs."}
          </p>
        </section>
      )}

      <section className="mt-8 rounded-[--radius-card] border border-warn/45 bg-sunken p-4">
        <h2 className="text-[0.7rem] font-bold uppercase tracking-[0.09em] text-warn">
          {t(locale, "trk.protoControl")}
        </h2>
        <p className="mt-1.5 text-[0.86rem] leading-relaxed text-ink">
          {t(locale, "trk.protoBody")}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {JUMPS.map((d) => (
            <Link
              key={d}
              href={`${base}&day=${d}`}
              aria-current={d === day ? "true" : undefined}
              className={`rounded-lg border px-3 py-2 text-[0.85rem] font-semibold ${
                d === day
                  ? "border-brand bg-brand text-white"
                  : "border-line-strong bg-card text-ink"
              }`}
            >
              {t(locale, "trk.day")} {d}
            </Link>
          ))}
        </div>
      </section>
    </PortalShell>
  );
}
