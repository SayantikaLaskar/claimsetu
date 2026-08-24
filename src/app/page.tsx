import Link from "next/link";
import { Button, Card, Label, Note } from "@/components/ui";
import { RULES } from "@/lib/engine/rules";

/**
 * Landing page.
 *
 * The positioning changed here, and it matters more than the visual pass. This
 * is not a replacement portal — nobody is going to replace the EPFO member
 * portal, and proposing it makes the whole argument dismissible. It is a
 * validation step that the existing portal could adopt without changing
 * anything else: one call before the submit button, against rules EPFO already
 * applies. Small change, and it removes the largest single cause of harm in the
 * system.
 *
 * So the page argues in that order: the harm, the cause, the one-line fix, then
 * the demo as evidence.
 */

const STATS = [
  { figure: "8.31 cr", label: "EPF claims a year", note: "FY 2025-26" },
  { figure: "1 in 5", label: "rejected", note: "174 lakh of 796 lakh, FY 2024-25" },
  { figure: "34 cr", label: "members", note: "EPF Scheme, 2026" },
  { figure: "20 days", label: "EPFO's own promise", note: "Citizen's Charter" },
];

const TODAY = [
  "Picks Form 19 from a list that also offers 10C, 10D and 31, unexplained.",
  "Files. The portal says: submitted.",
  "Nineteen days of nothing.",
  "Day twenty: <em>Member name not matching as per Aadhaar.</em>",
  "Not told his employer never marked his exit, so attempt two fails too.",
  "Not told his bank name differs, so an approved payment would bounce.",
  "Files again. Rejected again. Pays an agent ₹2,000.",
];

const HERE = [
  "Says he left his job and wants his money. The form is derived.",
  "Twelve seconds, before anything is filed.",
  "Four things will cause rejection. Three more cost him money.",
  "<em>Ramesh K</em> against <em>Ramesh Kumar</em>. Declaration filled and waiting.",
  "The exit date is his employer's job. That letter is drafted and dated.",
  "No PAN costs him ₹30,917 in avoidable tax. Nobody had said so.",
  "Twenty-one days to a claim that passes first time.",
];

const CAUSES = [
  {
    n: "01",
    h: "Validation runs after you commit",
    b: "A name differing by one word is detectable in milliseconds. EPFO detects it correctly — on day twenty. The information existed on day zero. Only the timing makes it a harm.",
  },
  {
    n: "02",
    h: "Nobody is told who has to act",
    b: "The commonest rejection is an unmarked exit date, which is an employer's obligation. The member sees only that they failed, so they wait for a system that is itself waiting.",
  },
  {
    n: "03",
    h: "A million identical rejections change nothing upstream",
    b: "174 lakh rejections a year cluster into roughly twenty causes. Each is handled as individual misfortune. None becomes a reason to check earlier.",
  },
];

export default function Landing() {
  return (
    <>
      {/* Hero */}
      <section className="bg-ink px-4 pt-12 pb-14 text-paper">
        <div className="mx-auto max-w-3xl">
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-paper/50">
            ClaimSetu &middot; prototype
          </p>
          <h1 className="mt-4 text-[2.1rem] leading-[1.08] font-bold tracking-tight text-balance sm:text-[2.75rem]">
            One EPF claim in five is refused.
            <span className="mt-1 block text-paper/55">
              Almost always for something knowable before you file.
            </span>
          </h1>
          <p className="mt-5 max-w-xl text-[1.02rem] leading-relaxed text-paper/70">
            Not a replacement portal. A validation step the existing one could
            adopt: {RULES.length} rules EPFO already applies, run before the
            submit button instead of three weeks after it.
          </p>

          <div className="mt-7 flex flex-wrap gap-2.5">
            <Link
              href="/login"
              className="rounded-[--radius-card] bg-paper px-5 py-3 text-[0.96rem] font-semibold text-ink"
            >
              Open the demo portal →
            </Link>
            <Link
              href="/integration"
              className="rounded-[--radius-card] border border-paper/25 px-5 py-3 text-[0.96rem] font-semibold text-paper"
            >
              How it drops in
            </Link>
          </div>
          <p className="mt-3 text-[0.78rem] text-paper/45">
            Five invented member records. Credentials printed on the sign-in page.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b border-line bg-card px-4 py-7">
        <dl className="mx-auto grid max-w-3xl grid-cols-2 gap-x-6 gap-y-6 sm:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.label}>
              <dt className="text-[1.35rem] font-bold leading-none tracking-tight tabular-nums text-brand">
                {s.figure}
              </dt>
              <dd className="mt-1.5 text-[0.82rem] font-medium leading-snug text-ink">
                {s.label}
              </dd>
              <dd className="mt-0.5 text-[0.7rem] leading-snug text-ink-faint">{s.note}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* The change */}
      <section className="px-4 py-12">
        <div className="mx-auto max-w-3xl">
          <Label>The whole proposal</Label>
          <h2 className="mt-2 text-[1.5rem] font-bold leading-tight tracking-tight text-balance">
            Move the check to before the submit button.
          </h2>

          <div className="mt-6 space-y-3">
            <Card tone="sunken" className="p-4">
              <Label>Today</Label>
              <ol className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-2 font-mono text-[0.76rem] text-ink-soft">
                {["fill form", "submit", "20 days", "validate", "REJECT"].map((step, i, a) => (
                  <li key={step} className="flex items-center gap-2">
                    <span
                      className={`rounded border px-2 py-1 ${
                        step === "REJECT"
                          ? "border-stop/40 font-bold text-stop"
                          : "border-line bg-card"
                      }`}
                    >
                      {step}
                    </span>
                    {i < a.length - 1 && <span aria-hidden className="text-ink-faint">→</span>}
                  </li>
                ))}
              </ol>
            </Card>

            <Card tone="accent" className="p-4">
              <Label>Proposed</Label>
              <ol className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-2 font-mono text-[0.76rem] text-ink-soft">
                {["fill form", "PRE-FLIGHT", "fix", "submit", "validate", "SETTLED"].map(
                  (step, i, a) => (
                    <li key={step} className="flex items-center gap-2">
                      <span
                        className={`rounded border px-2 py-1 ${
                          step === "PRE-FLIGHT"
                            ? "border-brand bg-brand font-bold text-white"
                            : step === "SETTLED"
                              ? "border-go/40 bg-card font-bold text-go"
                              : "border-line bg-card"
                        }`}
                      >
                        {step}
                      </span>
                      {i < a.length - 1 && <span aria-hidden className="text-ink-faint">→</span>}
                    </li>
                  ),
                )}
              </ol>
            </Card>
          </div>

          <p className="mt-4 text-[0.95rem] leading-relaxed text-ink-soft">
            One synchronous call on a screen that already exists. No new database,
            no change to how claims are settled, no migration.{" "}
            <Link
              href="/integration"
              className="font-semibold text-brand underline decoration-brand/40 underline-offset-4"
            >
              The integration in detail
            </Link>
            .
          </p>
        </div>
      </section>

      {/* Story */}
      <section className="border-t border-line bg-card px-4 py-12">
        <div className="mx-auto max-w-3xl">
          <Label>What it looks like for one person</Label>
          <h2 className="mt-2 text-[1.5rem] font-bold leading-tight tracking-tight text-balance">
            Ramesh, four years at an auto parts factory in Bengaluru.
          </h2>
          <p className="mt-2.5 max-w-2xl text-[0.98rem] leading-relaxed text-ink-soft">
            He left in May. ₹1,54,585 of his own savings sits in the account.
            Everything below is what the engine actually returns for his record.
          </p>

          <div className="mt-7 grid gap-4 md:grid-cols-2">
            {[
              { rule: "bg-stop", tone: "text-stop", head: "On the portal today", lines: TODAY, foot: "Eleven weeks. ₹2,000 to an agent. ₹30,917 in avoidable tax." },
              { rule: "bg-go", tone: "text-go", head: "With the check in front", lines: HERE, foot: "Nothing was invented for this comparison. The engine found all seven." },
            ].map((col) => (
              <div key={col.head} className="flex overflow-hidden rounded-[--radius-card] border border-line">
                <div className={`w-[3px] shrink-0 ${col.rule}`} aria-hidden />
                <div className="min-w-0 flex-1 p-4">
                  <p className={`text-[0.7rem] font-bold uppercase tracking-[0.09em] ${col.tone}`}>
                    {col.head}
                  </p>
                  <ol className="mt-3 space-y-2.5">
                    {col.lines.map((line, i) => (
                      <li key={i} className="flex gap-2.5 text-[0.88rem] leading-relaxed text-ink-soft">
                        <span className="mt-[0.45rem] size-1 shrink-0 rounded-full bg-line-strong" aria-hidden />
                        <span dangerouslySetInnerHTML={{ __html: line }} />
                      </li>
                    ))}
                  </ol>
                  <p className="mt-3.5 border-t border-line pt-3 text-[0.86rem] font-semibold leading-snug text-ink">
                    {col.foot}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Causes */}
      <section className="px-4 py-12">
        <div className="mx-auto max-w-3xl">
          <Label>Why it happens</Label>
          <h2 className="mt-2 text-[1.5rem] font-bold leading-tight tracking-tight text-balance">
            The portal is not slow. It checks in the wrong order.
          </h2>

          <div className="mt-7 space-y-6">
            {CAUSES.map((x) => (
              <div key={x.n} className="flex gap-4">
                <span className="mt-0.5 font-mono text-[0.82rem] font-bold text-brand">{x.n}</span>
                <div>
                  <h3 className="text-[1.02rem] font-bold leading-snug text-ink">{x.h}</h3>
                  <p className="mt-1.5 text-[0.92rem] leading-relaxed text-ink-soft">{x.b}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Honesty */}
      <section className="border-t border-line px-4 py-12">
        <div className="mx-auto max-w-3xl">
          <Label>What is real here, and what is not</Label>
          <dl className="mt-4 grid gap-4 sm:grid-cols-2">
            {[
              ["Real", `The rule engine. All ${RULES.length} checks are written out, run deterministically, and cite the scheme paragraph they rest on. Documents are real drafts. Passbook arithmetic follows the actual contribution split, and every balance is computed from it rather than asserted.`],
              ["Mocked", "Member records, sign-in, the Aadhaar OTP, claim submission, and the progress of a filed claim. No live government system is contacted and nothing is submitted anywhere."],
              ["Simplified", "Advance ceilings and some service thresholds approximate provisions that vary by circular; every simplified rule says so in code. Interest is credited annually rather than on a monthly running balance."],
              ["Not affiliated", "Not an EPFO or Government of India service, carries no emblem, endorsed by nobody. A prototype built to argue for a change in when the real thing validates."],
            ].map(([h, b]) => (
              <Card key={h} className="p-4">
                <p className="font-bold text-ink">{h}</p>
                <p className="mt-1.5 text-[0.88rem] leading-relaxed text-ink-soft">{b}</p>
              </Card>
            ))}
          </dl>

          <Note tone="warn">
            Built with Codex. Voice runs on the browser&rsquo;s own speech engine
            so it costs nothing and needs no key;{" "}
            <Link href="/integration#voice" className="font-semibold underline underline-offset-2">
              where an OpenAI model would replace it
            </Link>{" "}
            is set out with the reasoning and the cost.
          </Note>
        </div>
      </section>

      <section className="bg-ink px-4 py-12 text-paper">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-[1.4rem] font-bold leading-tight tracking-tight text-balance">
            Sign in as Ramesh and watch it find all seven.
          </h2>
          <Link
            href="/login"
            className="mt-5 inline-block rounded-[--radius-card] bg-paper px-5 py-3 text-[0.96rem] font-semibold text-ink"
          >
            Open the demo portal →
          </Link>
        </div>
      </section>
    </>
  );
}
