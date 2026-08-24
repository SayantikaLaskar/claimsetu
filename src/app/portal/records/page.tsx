import Link from "next/link";
import { redirect } from "next/navigation";
import { PortalShell } from "@/components/PortalShell";
import { FindingCard } from "@/components/FindingCard";
import { currentMember } from "@/lib/session";
import { personaFor } from "@/lib/data/personas";
import { profileHealth } from "@/lib/engine/preflight";
import { localiseFindings } from "@/lib/i18n/localise";
import { compareNames } from "@/lib/engine/text";
import { formatIndianDate } from "@/lib/engine/dates";
import { readLocale } from "@/lib/locale";
import { t } from "@/lib/i18n";

/**
 * The mismatch map.
 *
 * Three institutions hold a copy of who you are, and a claim only moves when all
 * three agree exactly. No screen anywhere shows a citizen those three copies
 * side by side, so a person can be blocked for years by a discrepancy they have
 * no way to see. Putting the copies in one table is a small thing that resolves
 * a large class of failure.
 */
export default async function RecordsPage({
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
  const raw = profileHealth(member, asOf);
  const health = { ...raw, findings: localiseFindings(raw.findings, locale) };

  const rows: Array<{
    field: string;
    epfo: string;
    aadhaar: string;
    bank?: string;
    agrees: boolean;
    note?: string;
  }> = [
    {
      field: t(locale, "rec.name"),
      epfo: member.epfoName,
      aadhaar: member.aadhaarName,
      bank: member.bank.nameOnAccount,
      agrees:
        compareNames(member.epfoName, member.aadhaarName) === "EXACT" &&
        compareNames(member.epfoName, member.bank.nameOnAccount) === "EXACT",
      note: t(locale, "rec.noteName"),
    },
    {
      field: t(locale, "rec.dob"),
      epfo: formatIndianDate(member.epfoDob),
      aadhaar: formatIndianDate(member.aadhaarDob),
      agrees: member.epfoDob === member.aadhaarDob,
      note: t(locale, "rec.noteDob"),
    },
    {
      field: t(locale, "rec.relation"),
      epfo: member.epfoFatherName,
      aadhaar: member.aadhaarFatherName,
      agrees: compareNames(member.epfoFatherName, member.aadhaarFatherName) === "EXACT",
      note: t(locale, "rec.noteRelation"),
    },
    {
      field: t(locale, "rec.gender"),
      epfo: member.epfoGender,
      aadhaar: member.aadhaarGender,
      agrees: member.epfoGender === member.aadhaarGender,
    },
  ];

  const kyc: Array<{ label: string; value: string; ok: boolean; note?: string }> = [
    {
      label: t(locale, "rec.kyc1"),
      value: member.aadhaarKyc,
      ok: member.aadhaarKyc === "VERIFIED",
      note: t(locale, "rec.kyc1n"),
    },
    {
      label: t(locale, "rec.kyc2"),
      value: member.panKyc,
      ok: member.panKyc === "VERIFIED",
      note: t(locale, "rec.kyc2n"),
    },
    {
      label: t(locale, "rec.kyc3"),
      value: member.bank.status,
      ok: member.bank.status === "VERIFIED",
      note: `Account ending ${member.bank.accountNumber.slice(-4)} · ${member.bank.ifsc}`,
    },
    {
      label: t(locale, "rec.kyc4"),
      value: member.mobileLinkedToAadhaar ? "YES" : "NO",
      ok: member.mobileLinkedToAadhaar,
      note: t(locale, "rec.kyc4n"),
    },
    {
      label: t(locale, "rec.kyc5"),
      value: member.eNominationFiled ? "YES" : "NO",
      ok: member.eNominationFiled,
      note: t(locale, "rec.kyc5n"),
    },
  ];

  return (
    <PortalShell
      locale={locale}
      name={persona?.name ?? member.epfoName}
      uan={member.uan}
      active="/portal/records"
    >
      <h1 className="text-[1.4rem] font-bold leading-tight tracking-tight">{t(locale, "rec.title")}</h1>
      <p className="mt-2 text-[0.92rem] leading-relaxed text-ink-soft">
        {t(locale, "rec.sub")}
      </p>

      {/* Who you are, according to three institutions */}
      <section className="mt-6 overflow-x-auto rounded-[--radius-card] border border-line bg-card">
        <table className="w-full min-w-[34rem] border-collapse text-left">
          <thead>
            <tr className="border-b border-line text-[0.7rem] uppercase tracking-[0.09em] text-ink-faint">
              <th scope="col" className="px-4 py-2.5 font-semibold">{t(locale, "rec.field")}</th>
              <th scope="col" className="px-4 py-2.5 font-semibold">EPFO</th>
              <th scope="col" className="px-4 py-2.5 font-semibold">Aadhaar</th>
              <th scope="col" className="px-4 py-2.5 font-semibold">{t(locale, "rec.bank")}</th>
              <th scope="col" className="px-4 py-2.5 font-semibold">{t(locale, "rec.agrees")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.field} className="border-b border-line last:border-0 align-top">
                <th scope="row" className="px-4 py-3 text-[0.86rem] font-semibold text-ink">
                  {r.field}
                  {r.note && (
                    <span className="mt-0.5 block text-[0.74rem] font-normal leading-snug text-ink-faint">
                      {r.note}
                    </span>
                  )}
                </th>
                <td className="px-4 py-3 text-[0.86rem] text-ink">{r.epfo}</td>
                <td
                  className={`px-4 py-3 text-[0.86rem] ${
                    r.agrees ? "text-ink" : "font-semibold text-stop"
                  }`}
                >
                  {r.aadhaar}
                </td>
                <td className="px-4 py-3 text-[0.86rem] text-ink-soft">{r.bank ?? "—"}</td>
                <td className="px-4 py-3 text-[0.86rem]">
                  {r.agrees ? (
                    <span className="font-semibold text-go">{t(locale, "rec.yes")}</span>
                  ) : (
                    <span className="font-semibold text-stop">{t(locale, "rec.no")}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* KYC state */}
      <section className="mt-6">
        <h2 className="text-[0.7rem] font-semibold uppercase tracking-[0.09em] text-ink-faint">
          {t(locale, "rec.verification")}
        </h2>
        <ul className="mt-3 divide-y divide-line rounded-[--radius-card] border border-line bg-card">
          {kyc.map((k) => (
            <li key={k.label} className="px-4 py-3">
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <span className="font-medium text-ink">{k.label}</span>
                <span
                  className={`text-[0.8rem] font-bold uppercase tracking-wide ${
                    k.ok ? "text-go" : "text-stop"
                  }`}
                >
                  {k.value}
                </span>
              </div>
              {k.note && (
                <p className="mt-0.5 text-[0.78rem] leading-snug text-ink-faint">{k.note}</p>
              )}
            </li>
          ))}
        </ul>
      </section>

      {/* Employment history */}
      <section className="mt-6">
        <h2 className="text-[0.7rem] font-semibold uppercase tracking-[0.09em] text-ink-faint">
          {t(locale, "rec.service")}
        </h2>
        <ul className="mt-3 space-y-3">
          {member.spells.map((s) => (
            <li key={s.establishmentId} className="rounded-[--radius-card] border border-line bg-card p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <span className="font-semibold text-ink">{s.employerName}</span>
                <span className="font-mono text-[0.74rem] text-ink-faint">
                  {s.establishmentId}
                </span>
              </div>
              <p className="mt-1 text-[0.86rem] text-ink-soft">
                {formatIndianDate(s.doj)} —{" "}
                {s.doe ? (
                  formatIndianDate(s.doe)
                ) : (
                  <span className="font-semibold text-warn">
                    {t(locale, "rec.noExit")}
                  </span>
                )}
              </p>
              <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-[0.78rem] text-ink-faint">
                <span>
                  {t(locale, "rec.pensionScheme")}:{" "}
                  <span className="font-semibold text-ink">{t(locale, s.epsMember ? "rec.yes" : "rec.no")}</span>
                </span>
                <span>
                  {t(locale, "rec.transferredIn")}:{" "}
                  <span
                    className={`font-semibold ${
                      s.transferredIntoCurrentUan ? "text-ink" : "text-stop"
                    }`}
                  >
                    {t(locale, s.transferredIntoCurrentUan ? "rec.yes" : "rec.no")}
                  </span>
                </span>
                {s.contributionGapMonths.length > 0 && (
                  <span className="font-semibold text-stop">
                    {s.contributionGapMonths.length} {t(locale, "rec.notDeposited")}
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
        {member.unmergedUans.length > 0 && (
          <p className="mt-3 rounded-[--radius-card] border border-stop/40 bg-sunken p-4 text-[0.88rem] leading-relaxed text-ink">
            <strong className="font-semibold">
              {t(locale, "rec.otherUan")}: {member.unmergedUans.join(", ")}.
            </strong>{" "}
            {t(locale, "rec.otherUanBody")}
          </p>
        )}
      </section>

      {/* Findings */}
      {health.findings.length > 0 && (
        <section className="mt-8">
          <h2 className="text-[1.1rem] font-bold leading-snug text-ink">
            {t(locale, "rec.fixOrder")}
          </h2>
          <p className="mt-1.5 text-[0.9rem] leading-relaxed text-ink-soft">
            {t(locale, "rec.fixOrderSub")}
          </p>
          <div className="mt-4 space-y-4">
            {health.findings.map((f) => (
              <FindingCard
                key={f.ruleId}
                finding={f}
                locale={locale}
                href={`/portal/claim/fix?need=left-job&rule=${f.ruleId}&lang=${locale}`}
              />
            ))}
          </div>
        </section>
      )}

      <details className="mt-6 rounded-[--radius-card] border border-line bg-card">
        <summary className="cursor-pointer px-4 py-3 text-[0.88rem] font-medium text-ink">
          {t(locale, "check.passedShow")} &middot; {health.passed.length}{" "}
          {t(locale, "check.passed")}
        </summary>
        <ul className="space-y-1.5 border-t border-line px-4 py-3">
          {health.passed.map((label) => (
            <li key={label} className="flex gap-2 text-[0.85rem] text-ink-soft">
              <span aria-hidden className="text-go">✓</span>
              {label}
            </li>
          ))}
        </ul>
      </details>

      <Link
        href={`/portal/claim?lang=${locale}`}
        className="mt-6 block rounded-lg bg-brand px-4 py-3.5 text-center text-[1rem] font-semibold text-white"
      >
        {t(locale, "rec.nowCheck")} →
      </Link>
    </PortalShell>
  );
}
