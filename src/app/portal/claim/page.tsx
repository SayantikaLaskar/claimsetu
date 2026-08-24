import Link from "next/link";
import { redirect } from "next/navigation";
import { PortalShell } from "@/components/PortalShell";
import { currentMember } from "@/lib/session";
import { personaFor } from "@/lib/data/personas";
import { NEEDS, PURPOSES, needById } from "@/lib/needs";
import { profileHealth } from "@/lib/engine/preflight";
import { VoiceIntake } from "@/components/VoiceIntake";
import { t } from "@/lib/i18n";
import { one, readLocale } from "@/lib/locale";

export default async function ClaimPage({
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
  const spokenPurpose = one(sp.purpose);
  const asOf = new Date().toISOString().slice(0, 10);
  const health = profileHealth(member, asOf);

  // Step two: this need cannot be judged without a purpose and an amount.
  if (need?.needsPurpose) {
    return (
      <PortalShell
        locale={locale}
        name={persona?.name ?? member.epfoName}
        uan={member.uan}
        active="/portal/claim"
      >
        <Link
          href={`/portal/claim?lang=${locale}`}
          className="text-[0.85rem] font-medium text-ink-soft"
        >
          ← {t(locale, "nav.back")}
        </Link>

        <h1 className="mt-3 text-[1.35rem] font-bold leading-tight tracking-tight">
          {t(locale, "need.purpose")}
        </h1>
        <p className="mt-2 text-[0.92rem] leading-relaxed text-ink-soft">
          EPFO sets a different minimum service and a different ceiling for each
          purpose, and rejects the whole claim rather than paying a lower amount
          if the one you tick does not fit. Pick the real reason.
        </p>

        <form action="/portal/claim/check" method="get" className="mt-6 space-y-5">
          <input type="hidden" name="need" value={need.id} />
          <input type="hidden" name="lang" value={locale} />

          <fieldset className="space-y-2">
            <legend className="sr-only">{t(locale, "need.purpose")}</legend>
            {PURPOSES.map((p, i) => (
              <label
                key={p.id}
                className="flex cursor-pointer items-start gap-3 rounded-lg border border-line bg-card p-3.5 has-checked:border-brand has-checked:bg-brand-wash"
              >
                <input
                  type="radio"
                  name="purpose"
                  value={p.id}
                  defaultChecked={spokenPurpose ? p.id === spokenPurpose : i === 0}
                  required
                  className="mt-1 size-5 shrink-0 accent-[var(--brand)]"
                />
                <span>
                  <span className="block font-medium leading-snug text-ink">
                    {locale === "hi" ? p.labelHi : p.label}
                  </span>
                  <span className="mt-0.5 block text-[0.78rem] text-ink-faint">
                    Minimum service: {p.minService}
                  </span>
                </span>
              </label>
            ))}
          </fieldset>

          <div>
            <label htmlFor="amount" className="block font-semibold text-ink">
              {t(locale, "need.amount")}
            </label>
            <p className="mt-0.5 text-[0.8rem] text-ink-faint">
              {t(locale, "need.amountNote")}
            </p>
            <input
              id="amount"
              name="amount"
              type="number"
              inputMode="numeric"
              min={1}
              required
              defaultValue={100000}
              className="mt-2 w-full rounded-lg border border-line-strong bg-card px-3.5 py-3 text-lg tabular-nums text-ink"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-brand px-4 py-3.5 text-[1.05rem] font-semibold text-white"
          >
            {t(locale, "need.continue")}
          </button>
        </form>
      </PortalShell>
    );
  }

  return (
    <PortalShell
      locale={locale}
      name={persona?.name ?? member.epfoName}
      uan={member.uan}
      active="/portal/claim"
    >
      <h1 className="text-[1.4rem] font-bold leading-tight tracking-tight">
        {t(locale, "need.title")}
      </h1>
      <p className="mt-2 text-[0.92rem] leading-relaxed text-ink-soft">
        {t(locale, "need.sub")} Nothing is filed until you have seen the check.
      </p>

      {health.blockers > 0 && (
        <p className="mt-4 rounded-lg border border-warn/45 bg-sunken px-4 py-3 text-[0.88rem] leading-relaxed text-ink">
          <strong className="font-semibold">{t(locale, "need.beforeStart")}</strong>{" "}
          {health.blockers} {t(locale, "need.beforeStartBody")} —{" "}
          <Link
            href={`/portal/records?lang=${locale}`}
            className="font-semibold text-brand underline underline-offset-2"
          >
            {t(locale, "need.orFixFirst")}
          </Link>
          .
        </p>
      )}

      <div className="mt-5">
        <VoiceIntake locale={locale} />
      </div>

      <p className="mt-6 text-[0.7rem] font-semibold uppercase tracking-[0.09em] text-ink-faint">
        {t(locale, "need.orChoose")}
      </p>

      <ul className="mt-3 space-y-3">
        {NEEDS.map((n) => {
          const href = n.needsPurpose
            ? `/portal/claim?need=${n.id}&lang=${locale}`
            : `/portal/claim/check?need=${n.id}&lang=${locale}`;
          return (
            <li key={n.id}>
              <Link
                href={href}
                className="block rounded-[--radius-card] border border-line bg-card p-4 transition-colors hover:border-brand"
              >
                <span className="block font-semibold leading-snug text-ink">
                  {locale === "hi" ? n.labelHi : n.label}
                </span>
                <span className="mt-1 block text-[0.86rem] leading-snug text-ink-soft">
                  {locale === "hi" ? n.detailHi : n.detail}
                </span>
                <span className="mt-2 block text-[0.75rem] text-ink-faint">
                  {t(locale, "need.formIs")}{" "}
                  <span className="font-medium">{n.formName}</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </PortalShell>
  );
}
