import { notFound, redirect } from "next/navigation";
import { PortalShell } from "@/components/PortalShell";
import { currentMember } from "@/lib/session";
import { personaFor } from "@/lib/data/personas";
import { needById } from "@/lib/needs";
import { preflight, amountAtStake } from "@/lib/engine/preflight";
import { formatRupees } from "@/lib/engine/dates";
import type { AdvancePurpose, ClaimIntent } from "@/lib/engine/types";
import { one, readLocale } from "@/lib/locale";

export default async function FilePage({
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

  const result = preflight(member, claim);
  // Filing is offered only on a clean pre-flight. Letting a member file into a
  // known rejection would reproduce the exact failure this exists to prevent.
  if (result.verdict !== "GO") notFound();

  const amount = amountAtStake(member, claim);

  return (
    <PortalShell
      locale={locale}
      name={persona?.name ?? member.epfoName}
      uan={member.uan}
      active="/portal/claim"
    >
      <h1 className="text-[1.35rem] font-bold leading-tight tracking-tight">
        Confirm and file
      </h1>
      <p className="mt-2 text-[0.92rem] leading-relaxed text-ink-soft">
        All {result.passed.length} checks passed. This is what goes to EPFO.
      </p>

      <dl className="mt-5 divide-y divide-line rounded-[--radius-card] border border-line bg-card">
        {(
          [
            ["Member", persona?.name ?? member.epfoName],
            ["UAN", member.uan],
            ["Claim", `${need.formName} — ${need.label}`],
            ...(claim.purpose
              ? [["Purpose", claim.purpose.replace(/_/g, " ").toLowerCase()]]
              : []),
            ["Amount", formatRupees(amount)],
            [
              "Paid into",
              `${member.bank.ifsc} · account ending ${member.bank.accountNumber.slice(-4)}`,
            ],
            ["In the name of", member.bank.nameOnAccount],
          ] as Array<[string, string]>
        ).map(([k, v]) => (
          <div key={k} className="flex flex-wrap items-baseline justify-between gap-3 px-4 py-3">
            <dt className="text-[0.82rem] text-ink-faint">{k}</dt>
            <dd className="text-[0.92rem] font-medium text-ink">{v}</dd>
          </div>
        ))}
      </dl>

      <form action="/portal/claims" method="get" className="mt-6">
        <input type="hidden" name="need" value={need.id} />
        <input type="hidden" name="lang" value={locale} />
        <input type="hidden" name="day" value="0" />
        {claim.purpose && <input type="hidden" name="purpose" value={claim.purpose} />}
        {claim.requestedAmount && (
          <input type="hidden" name="amount" value={claim.requestedAmount} />
        )}

        <div className="rounded-[--radius-card] border border-warn/45 bg-sunken p-4">
          <p className="text-[0.7rem] font-bold uppercase tracking-[0.09em] text-warn">
            Mock verification
          </p>
          <p className="mt-1.5 text-[0.88rem] leading-relaxed text-ink">
            The real claim is authorised by an OTP sent to the mobile number
            registered against your Aadhaar. This prototype does not contact
            UIDAI, EPFO or any other live system. Enter{" "}
            <strong className="font-mono">123456</strong> to continue.
          </p>
          <label htmlFor="otp" className="mt-3 block text-[0.85rem] font-semibold text-ink">
            Six-digit code
          </label>
          <input
            id="otp"
            name="otp"
            inputMode="numeric"
            pattern="\d{6}"
            maxLength={6}
            required
            defaultValue="123456"
            className="mt-1.5 w-40 rounded-lg border border-line-strong bg-card px-3.5 py-3 font-mono text-lg tracking-[0.3em] tabular-nums text-ink"
          />
        </div>

        <button
          type="submit"
          className="mt-5 w-full rounded-lg bg-brand px-4 py-3.5 text-[1.05rem] font-semibold text-white"
        >
          File this claim
        </button>
      </form>
    </PortalShell>
  );
}
