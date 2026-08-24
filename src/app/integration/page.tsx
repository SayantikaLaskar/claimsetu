import Link from "next/link";
import { Card, Label, Note } from "@/components/ui";
import { RULES } from "@/lib/engine/rules";

/**
 * The integration argument.
 *
 * Judged against "does the solution address the backend, infrastructure and
 * processes, not just the interface", this page is the answer. The claim being
 * made is deliberately small: one synchronous call on a screen that already
 * exists, against rules EPFO already applies, with no change to settlement, no
 * new database and no migration. A proposal to rebuild the member portal would
 * be correct and useless. This one is adoptable.
 */

const UNCHANGED = [
  "How claims are settled, and by whom",
  "The claim forms themselves and their field names",
  "The employer portal and its approval flows",
  "The ECR filing and contribution pipeline",
  "Every database, schema and system of record",
  "The grievance system and its categories",
];

const CHANGED = [
  "One synchronous call on the claim screen, before submit",
  "Rejection reasons published as stable machine-readable codes",
  "The submit button disabled while a blocker stands, with the reason shown",
  "An employer-action queue derived from what the check already finds",
];

const REQUEST = `POST /preflight
{
  "uan": "100xxxxxxxxx",
  "claim": { "form": "19" },
  "asOf": "2026-08-24"
}

// EPFO reads the member record internally. Nothing
// about the member is sent by the client.`;

const RESPONSE = `{
  "verdict": "FIX_FIRST",
  "estimatedDaysToReady": 21,
  "findings": [
    {
      "ruleId": "KYC_NAME_MISMATCH",
      "severity": "BLOCKER",
      "actor": "MEMBER",
      "typicalDaysToFix": 21,
      "citation": "JD circular, 2023",
      "rejectionCode": "E-KYC-NAME-001"
    },
    {
      "ruleId": "SERVICE_EXIT_DATE_MISSING",
      "severity": "BLOCKER",
      "actor": "EMPLOYER",
      "typicalDaysToFix": 15,
      "establishment": "MHBAN0045678000"
    }
  ],
  "passed": ["KYC_DOB_MISMATCH", "..."]
}`;

const MODELS = [
  {
    id: "voice",
    model: "gpt-4o-transcribe",
    job: "Understanding what the member actually said",
    now: "Keyword lookup in the browser. It matches the word “ilaj” to a medical advance and misses everything phrased unusually.",
    with: "“Paisa chahiye, bacche ki fees bharni hai” resolves to an education advance under paragraph 68K, with the seven-year service test already applied. Code-mixed Hinglish is the normal case in this user base, and keyword matching cannot survive it.",
    cost: "≈ ₹0.25 per claim for a 30-second utterance",
  },
  {
    id: "readaloud",
    model: "gpt-4o-mini-tts",
    job: "Reading the verdict aloud",
    now: "The device's own voice. On the cheap Android handsets that matter most here, Devanagari is often read by a Latin voice and comes out as nonsense.",
    with: "A verdict that is actually intelligible in eight languages, at a pace set for consequential information. For a member who cannot read the explanation, this is the difference between the product working and not.",
    cost: "≈ ₹1.70 for a 200-word verdict",
  },
  {
    id: "translation",
    model: "gpt-5-mini",
    job: "Rule text in eight languages",
    now: `English and Hindi are hand-written. The other six languages switch the interface chrome only; the ${RULES.length} rule explanations stay in English.`,
    with: "Every rule explanation in all eight languages, generated once at build time and shipped in the bundle — so it costs nothing at runtime and cannot fail on a bad connection. Hand-maintaining 26 rules across 8 languages guarantees the translations rot; generating them guarantees they exist.",
    cost: "≈ ₹6 once, for the whole catalogue",
  },
  {
    id: "grievance",
    model: "gpt-5-mini",
    job: "Adapting the grievance to the case",
    now: "Four hand-written templates, selected by rule. Accurate, and blunt where a case is unusual.",
    with: "The same template, tightened against the member's actual dates and establishment history — while the legal skeleton and every citation stay template-fixed, because a grievance quoting a paragraph that does not exist is worse than none.",
    cost: "≈ ₹0.10 per document",
  },
];

export default function Integration() {
  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
      <Link href="/" className="text-[0.85rem] font-medium text-ink-soft">
        ← ClaimSetu
      </Link>

      <h1 className="mt-5 text-[1.85rem] font-bold leading-tight tracking-tight text-balance">
        How this becomes part of the portal that already exists
      </h1>
      <p className="mt-3 text-[1rem] leading-relaxed text-ink-soft">
        Nobody is going to replace the EPFO member portal, and proposing it makes
        the argument easy to dismiss. The change being asked for here is one call
        on one screen, against rules EPFO already applies to the same data. The
        blast radius is a single screen. The effect is on the largest single
        cause of harm in the system.
      </p>

      {/* Where it sits */}
      <section className="mt-10">
        <Label>Where it sits</Label>
        <h2 className="mt-2 text-[1.3rem] font-bold leading-snug tracking-tight">
          On the claim screen, above the submit button
        </h2>
        <p className="mt-2 text-[0.94rem] leading-relaxed text-ink-soft">
          A facsimile of the existing screen, with the only addition marked. Every
          other field, label and control is untouched.
        </p>

        {/* Facsimile of the existing EPFO claim screen */}
        <div className="mt-5 overflow-hidden rounded-[--radius-card] border-2 border-line-strong">
          <div className="border-b border-line-strong bg-sunken px-4 py-2.5">
            <p className="font-mono text-[0.72rem] text-ink-faint">
              unifiedportal-mem.epfindia.gov.in / Online Services / Claim (Form 31, 19, 10C &amp; 10D)
            </p>
          </div>

          <div className="space-y-3 bg-card px-4 py-4 opacity-60">
            {[
              ["Member Name", "RAMESH K YADAV"],
              ["UAN", "100xxxxxxxxx"],
              ["Bank Account Number", "XXXXXXX7890"],
              ["I want to apply for", "PF Settlement (Form 19)"],
            ].map(([k, v]) => (
              <div key={k} className="grid gap-1 sm:grid-cols-[11rem_1fr] sm:items-center">
                <span className="text-[0.78rem] text-ink-faint">{k}</span>
                <span className="rounded border border-line bg-sunken px-2.5 py-1.5 font-mono text-[0.8rem] text-ink-soft">
                  {v}
                </span>
              </div>
            ))}
          </div>

          {/* The insertion */}
          <div className="border-y-2 border-brand bg-brand-wash px-4 py-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-[0.68rem] font-bold uppercase tracking-[0.09em] text-brand">
                ← the only addition
              </p>
              <p className="font-mono text-[0.68rem] text-brand-ink">GET /preflight · 380 ms</p>
            </div>
            <p className="mt-2 text-[0.98rem] font-bold leading-snug text-ink">
              This claim will be rejected. Four things to fix first.
            </p>
            <ul className="mt-2 space-y-1 text-[0.85rem] leading-snug text-ink-soft">
              <li>· Your name does not match Aadhaar — <strong className="text-ink">you</strong>, about 21 days</li>
              <li>· Exit date not marked — <strong className="text-ink">your employer</strong>, about 15 days</li>
              <li>· Bank account not verified — <strong className="text-ink">your employer</strong></li>
              <li>· Bank name does not match — <strong className="text-ink">your bank</strong></li>
            </ul>
            <p className="mt-2.5 text-[0.8rem] text-brand-ink underline underline-offset-2">
              Fix these, with the forms filled →
            </p>
          </div>

          <div className="bg-card px-4 py-4">
            <button
              type="button"
              disabled
              className="cursor-not-allowed rounded border border-line-strong bg-sunken px-5 py-2.5 text-[0.86rem] font-semibold text-ink-faint"
            >
              Get Aadhaar OTP
            </button>
            <p className="mt-2 text-[0.78rem] text-ink-faint">
              Held until the blockers clear. Today this button is live, and
              pressing it costs three weeks.
            </p>
          </div>
        </div>
      </section>

      {/* What changes */}
      <section className="mt-10">
        <Label>Scope of the change</Label>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <Card className="p-4">
            <p className="text-[0.7rem] font-bold uppercase tracking-[0.09em] text-go">
              Unchanged
            </p>
            <ul className="mt-2.5 space-y-1.5 text-[0.88rem] leading-snug text-ink-soft">
              {UNCHANGED.map((x) => (
                <li key={x} className="flex gap-2">
                  <span className="mt-[0.4rem] size-1 shrink-0 rounded-full bg-line-strong" aria-hidden />
                  {x}
                </li>
              ))}
            </ul>
          </Card>
          <Card tone="accent" className="p-4">
            <p className="text-[0.7rem] font-bold uppercase tracking-[0.09em] text-brand">
              Changed
            </p>
            <ul className="mt-2.5 space-y-1.5 text-[0.88rem] leading-snug text-ink-soft">
              {CHANGED.map((x) => (
                <li key={x} className="flex gap-2">
                  <span className="mt-[0.4rem] size-1 shrink-0 rounded-full bg-brand" aria-hidden />
                  {x}
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </section>

      {/* Contract */}
      <section className="mt-10">
        <Label>The contract</Label>
        <h2 className="mt-2 text-[1.3rem] font-bold leading-snug tracking-tight">
          Stateless, synchronous, no personal data crossing a boundary
        </h2>
        <p className="mt-2 text-[0.94rem] leading-relaxed text-ink-soft">
          The service runs inside EPFO and reads the member record directly, so
          nothing about the member leaves. It writes nothing. If it is down, the
          claim screen behaves exactly as it does today — which is what makes it
          safe to put in front of a live submit button.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {[["Request", REQUEST], ["Response", RESPONSE]].map(([h, body]) => (
            <div key={h}>
              <Label>{h}</Label>
              <pre className="mt-1.5 overflow-x-auto rounded-[--radius-card] border border-line bg-sunken px-3 py-3 font-mono text-[0.7rem] leading-relaxed whitespace-pre text-ink-soft">
                {body}
              </pre>
            </div>
          ))}
        </div>
      </section>

      {/* Second-order effect */}
      <section className="mt-10">
        <Label>The part that compounds</Label>
        <h2 className="mt-2 text-[1.3rem] font-bold leading-snug tracking-tight">
          The same call produces an employer work queue
        </h2>
        <p className="mt-2 text-[0.94rem] leading-relaxed text-ink-soft">
          Roughly half of what the engine finds is an employer&rsquo;s obligation,
          not the member&rsquo;s — an unmarked exit date, an unapproved KYC, an
          expired digital signature. Every finding already carries the
          establishment code and the actor. Aggregating them gives each employer a
          list of the workers they are blocking, and gives the regional office a
          ranked list of establishments blocking the most people. No new data is
          collected to produce either; it is a different grouping of the same
          check.
        </p>
        <Note>
          This is also the answer to the third cause on the home page. Once
          rejection reasons are stable codes rather than prose, the twenty causes
          behind 174 lakh rejections a year become countable — and a cause that
          can be counted can be fixed at intake instead of one member at a time.
        </Note>
      </section>

      {/* OpenAI */}
      <section id="voice" className="mt-10 scroll-mt-4">
        <Label>Where an OpenAI model earns its place</Label>
        <h2 className="mt-2 text-[1.3rem] font-bold leading-snug tracking-tight">
          Rules decide. The model translates, listens and speaks.
        </h2>
        <p className="mt-2 text-[0.94rem] leading-relaxed text-ink-soft">
          This prototype was built with Codex, and it runs no inference: voice
          uses the browser&rsquo;s own speech engine, and every verdict comes from
          the deterministic catalogue. That division is a design position, not a
          budget constraint — a citizen told &ldquo;your claim will be
          rejected&rdquo; is being given something they will act on for three
          weeks, and it has to trace to a written rule rather than a sampled
          token. But the four jobs below are exactly what a model is for, and
          each one is a real limitation today.
        </p>

        <div className="mt-5 space-y-3">
          {MODELS.map((m) => (
            <Card key={m.id} className="p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <h3 className="text-[1rem] font-bold leading-snug text-ink">{m.job}</h3>
                <code className="font-mono text-[0.72rem] text-brand">{m.model}</code>
              </div>
              <dl className="mt-2.5 space-y-2 text-[0.88rem] leading-relaxed">
                <div className="flex gap-2.5">
                  <dt className="w-14 shrink-0 text-[0.72rem] font-bold uppercase tracking-[0.07em] text-ink-faint">
                    Now
                  </dt>
                  <dd className="text-ink-soft">{m.now}</dd>
                </div>
                <div className="flex gap-2.5">
                  <dt className="w-14 shrink-0 text-[0.72rem] font-bold uppercase tracking-[0.07em] text-brand">
                    With
                  </dt>
                  <dd className="text-ink">{m.with}</dd>
                </div>
              </dl>
              <p className="mt-2.5 border-t border-line pt-2 text-[0.78rem] font-medium text-ink-faint">
                {m.cost}
              </p>
            </Card>
          ))}
        </div>

        <Card tone="accent" className="mt-4 p-4">
          <p className="text-[0.98rem] leading-relaxed text-ink">
            <strong className="font-bold">
              About ₹2 of inference per member journey.
            </strong>{" "}
            Against an average claim of roughly ₹1.5 lakh, a one-in-five rejection
            rate, and — in Ramesh&rsquo;s case alone — ₹30,917 of tax he loses
            purely because nobody told him to add a PAN first.
          </p>
          <p className="mt-2 text-[0.8rem] leading-relaxed text-ink-faint">
            Figures are estimates from list pricing at prototype volume, not a
            procurement quote. Translation is a one-time build cost; only voice is
            per-use, and only when the member chooses it.
          </p>
        </Card>
      </section>

      <section className="mt-10">
        <Label>Honest limits of this argument</Label>
        <ul className="mt-3 space-y-2 text-[0.9rem] leading-relaxed text-ink-soft">
          {[
            "The rule catalogue here is 26 rules assembled from published scheme paragraphs and observed rejection text. EPFO's real validation surface is larger, and only EPFO can enumerate it exactly.",
            "Advance ceilings and some service thresholds are simplified; every simplified rule is marked in code.",
            "The employer queue assumes establishments can be reached at all. Some are defunct, which is why every employer-owned finding also carries a grievance route that does not depend on them.",
            "Nothing here has been tested with the members it is for. The next honest step is not more features — it is watching ten people use it.",
          ].map((x) => (
            <li key={x} className="flex gap-2.5">
              <span className="mt-[0.5rem] size-1 shrink-0 rounded-full bg-line-strong" aria-hidden />
              {x}
            </li>
          ))}
        </ul>
      </section>

      <Link
        href="/login"
        className="mt-10 block rounded-[--radius-card] bg-brand px-4 py-3.5 text-center text-[1rem] font-semibold text-white"
      >
        See it working in the demo portal →
      </Link>
    </div>
  );
}
