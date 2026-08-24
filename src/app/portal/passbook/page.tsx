import { redirect } from "next/navigation";
import { PortalShell } from "@/components/PortalShell";
import { currentMember } from "@/lib/session";
import { personaFor } from "@/lib/data/personas";
import { buildPassbook, summarise } from "@/lib/passbook";
import { formatRupees } from "@/lib/engine/dates";
import { t } from "@/lib/i18n";
import { readLocale } from "@/lib/locale";

export default async function PassbookPage({
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
  const years = buildPassbook(member, asOf);
  const money = summarise(years);

  return (
    <PortalShell
      locale={locale}
      name={persona?.name ?? member.epfoName}
      uan={member.uan}
      active="/portal/passbook"
    >
      <h1 className="text-[1.4rem] font-bold leading-tight tracking-tight">{t(locale, "pb.title")}</h1>
      <p className="mt-2 text-[0.92rem] leading-relaxed text-ink-soft">
        {t(locale, "pb.sub")}
      </p>

      {money.missingAmount > 0 && (
        <div className="mt-5 rounded-[--radius-card] border border-stop/45 bg-sunken p-4">
          <p className="text-[0.86rem] leading-relaxed text-ink">
            <strong className="font-semibold">
              {formatRupees(money.missingAmount)} {t(locale, "pb.missingBanner")}
            </strong>{" "}
            {t(locale, "pb.missingBanner2")}
          </p>
        </div>
      )}

      {years.map((y) => (
        <section key={y.year} className="mt-7">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <h2 className="text-[1.05rem] font-bold text-ink">{y.year}</h2>
            <p className="text-[0.82rem] text-ink-faint">
              {t(locale, "pb.closing")}{" "}
              <span className="font-semibold tabular-nums text-ink">
                {formatRupees(y.closingBalance)}
              </span>
            </p>
          </div>

          <div className="mt-2.5 overflow-x-auto rounded-[--radius-card] border border-line bg-card">
            <table className="w-full min-w-[32rem] border-collapse text-right text-[0.84rem]">
              <thead>
                <tr className="border-b border-line text-[0.72rem] uppercase tracking-wide text-ink-faint">
                  <th scope="col" className="px-3 py-2.5 text-left font-semibold">{t(locale, "pb.month")}</th>
                  <th scope="col" className="px-3 py-2.5 font-semibold">{t(locale, "pb.wage")}</th>
                  <th scope="col" className="px-3 py-2.5 font-semibold">{t(locale, "pb.yours")}</th>
                  <th scope="col" className="px-3 py-2.5 font-semibold">{t(locale, "pb.employer")}</th>
                  <th scope="col" className="px-3 py-2.5 font-semibold">{t(locale, "pb.pension")}</th>
                </tr>
              </thead>
              <tbody>
                {y.rows.map((r) => (
                  <tr
                    key={r.month}
                    className={`border-b border-line last:border-0 ${
                      r.missing ? "bg-sunken" : ""
                    }`}
                  >
                    <th
                      scope="row"
                      className="px-3 py-2.5 text-left font-medium tabular-nums text-ink"
                    >
                      {r.month}
                      <span className="mt-0.5 block text-[0.7rem] font-normal text-ink-faint">
                        {r.employerName}
                      </span>
                    </th>
                    {r.missing ? (
                      <td colSpan={4} className="px-3 py-2.5 text-right font-semibold text-stop">
                        {t(locale, "pb.neverDeposited")} &middot;{" "}
                        {formatRupees(r.employeeShare + r.employerShare + r.pensionShare)} {t(locale, "pb.missing")}
                      </td>
                    ) : (
                      <>
                        <td className="px-3 py-2.5 tabular-nums text-ink-soft">
                          {formatRupees(r.wage)}
                        </td>
                        <td className="px-3 py-2.5 tabular-nums text-ink">
                          {formatRupees(r.employeeShare)}
                        </td>
                        <td className="px-3 py-2.5 tabular-nums text-ink">
                          {formatRupees(r.employerShare)}
                        </td>
                        <td className="px-3 py-2.5 tabular-nums text-ink-soft">
                          {r.pensionShare ? formatRupees(r.pensionShare) : "—"}
                        </td>
                      </>
                    )}
                  </tr>
                ))}
                <tr className="bg-paper text-[0.82rem] font-semibold">
                  <th scope="row" className="px-3 py-2.5 text-left text-ink">
                    {t(locale, "pb.depositedYear")}
                  </th>
                  <td className="px-3 py-2.5 text-ink-faint">—</td>
                  <td className="px-3 py-2.5 tabular-nums text-ink">
                    {formatRupees(y.employeeTotal)}
                  </td>
                  <td className="px-3 py-2.5 tabular-nums text-ink">
                    {formatRupees(y.employerTotal)}
                  </td>
                  <td className="px-3 py-2.5 tabular-nums text-ink">
                    {formatRupees(y.pensionTotal)}
                  </td>
                </tr>
                <tr className="bg-paper text-[0.82rem]">
                  <th scope="row" className="px-3 py-2.5 text-left font-semibold text-ink">
                    {t(locale, "pb.interestCredited")}
                  </th>
                  <td colSpan={4} className="px-3 py-2.5 font-semibold tabular-nums text-ink">
                    {formatRupees(y.interest)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      ))}

      <p className="mt-7 rounded-[--radius-card] border border-warn/40 bg-sunken p-4 text-[0.82rem] leading-relaxed text-ink">
        <strong className="font-semibold">{t(locale, "pb.simplified")}</strong>{" "}
        {t(locale, "pb.simplifiedBody")}
      </p>
    </PortalShell>
  );
}
