# ClaimSetu

**One EPF claim in five is refused — almost always for something knowable before you file.**

A prototype that runs the checks EPFO already runs, *before* the submit button instead
of three weeks after it. Built for the [Build What Moves India](https://buildwhatmovesindia.com/brief)
brief.

> **Prototype. Not an EPFO or Government of India service and not affiliated with
> either.** It carries no government emblem, is endorsed by nobody, and contacts no
> live government system. Every member record is invented. Nothing is filed anywhere.

---

## The problem

| | |
|---|---|
| **8.31 crore** | EPF claims filed in FY 2025-26 |
| **1 in 5** | rejected — 174 lakh of 796 lakh in FY 2024-25 |
| **34 crore** | members whose savings run through this system |
| **20 days** | EPFO's own settlement promise, which almost no member has heard of |

The rejection reason arrives weeks later as a code: *"Wages more than 15000"*,
*"Member name not matching as per Aadhaar"*. Three structural failures produce it:

1. **Validation runs after you commit.** A name differing by one word is detectable
   in milliseconds. EPFO detects it correctly — on day twenty. The information
   existed on day zero; only the timing makes it a harm.
2. **Nobody is told who has to act.** The commonest rejection is an unmarked exit
   date, which is an *employer's* obligation. The member sees only that they failed,
   so they wait for a system that is itself waiting.
3. **A million identical rejections change nothing upstream.** 174 lakh rejections a
   year cluster into roughly twenty causes, each handled as individual misfortune.

## The proposal

Not a replacement portal — nobody is going to replace the EPFO member portal, and
proposing it makes the argument dismissible. **One synchronous call on the claim
screen, above the submit button.**

```
Today      fill form → submit → 20 days → validate → REJECT
Proposed   fill form → PRE-FLIGHT → fix → submit → validate → SETTLED
```

**Unchanged:** how claims are settled, the forms and their field names, the employer
portal, the ECR pipeline, every database and system of record, the grievance system.

**Changed:** one call before submit; rejection reasons published as stable
machine-readable codes; the submit button held while a blocker stands; an
employer-action queue derived from what the check already finds.

The service runs *inside* EPFO and reads the member record directly, so nothing about
the member leaves. It writes nothing. If it is down, the claim screen behaves exactly
as it does today — which is what makes it safe to put in front of a live submit
button. See `/integration` in the running app for the contract and the facsimile.

---

## What is real, mocked, and simplified

**Real** — the rule engine. All **26 checks** are written out, run deterministically,
and cite the scheme paragraph or circular they rest on. The documents are genuinely
filable drafts. Passbook arithmetic follows the actual contribution split, and every
balance shown is *computed from it* rather than asserted, so a stolen contribution
reduces the headline figure exactly as it reduces the savings.

**Mocked** — member records, sign-in, the Aadhaar OTP, claim submission, and the
progress of a filed claim.

**Simplified** — advance ceilings and some service thresholds approximate provisions
that vary by circular; every simplified rule is flagged `simplified: true` in code.
Interest is credited annually rather than on EPFO's monthly running balance. Wages
are held flat within each employment.

**Untested with real members.** The next honest step is not more features — it is
watching ten people use it.

---

## Running it

```bash
npm install
npm run dev          # http://localhost:3000
```

No API keys or environment variables are required. Nothing calls out to any service.

```bash
npm run check        # run every persona through the engine, print verdicts
npm run i18n         # translation coverage audit — fails if any finding lacks Hindi
npm run passbook     # verify passbook arithmetic reconciles to stated balances
npm run build        # production build
```

### Demo credentials

Printed on the sign-in page too, one tap per persona.

| Member | UAN | Password | What it demonstrates |
|---|---|---|---|
| Ramesh Kumar Yadav | `900000000001` | `ramesh@2026` | The ordinary case: four records disagree about his name, and his employer never marked his exit |
| Sunita Devi | `900000000002` | `sunita@2026` | Ten years of work reads as four across two unmerged UANs — a lifelong pension reads as ineligible |
| Mohammed Irfan | `900000000003` | `irfan@2026` | Asking for the wrong thing; the claim he is filing is worth far less than the one he is owed |
| Ganesh Patil | `900000000004` | `ganesh@2026` | ₹12,168 deducted from wages over three months and never deposited |
| Lakshmi Narayanan | `900000000005` | `lakshmi@2026` | A clean record — what a claim genuinely ready to file looks like |

### Suggested walkthrough

1. **Ganesh → Home.** The dashboard leads with ₹12,168 that was deducted and never
   deposited. The real passbook omits those rows entirely, and an absence is not
   something a person can notice.
2. **Ganesh → Passbook.** Those months in red with a rupee figure, instead of missing.
3. **Ramesh → Claim money → "I have left my job".** Verdict: *would be rejected*,
   ₹1,54,585 at stake, ready in 21 days. Note **Who you are waiting on** — you 3
   things, your employer 2, your bank 1.
4. **Tap "Prepare this for me"** on the exit-date blocker → a dated letter to his
   employer with the exact EPFO screen, delivery instructions, and why to keep the
   acknowledged copy.
5. **Sunita → "I want to start my monthly pension"** — four months short of ten years,
   because 4y8m of service sits untransferred under a second UAN.
6. **Lakshmi → "I need money urgently" → medical → ₹1,20,000** → all checks pass →
   file (mock OTP `123456`) → **My claims → Day 27**, where the twenty-day promise has
   lapsed and the escalation letter is already drafted.
7. **Switch to हिन्दी** anywhere. Rule explanations, repair steps, stage descriptions
   and all interface copy change — not just the buttons.

---

## Architecture

```
src/lib/engine/       the rule catalogue — pure, deterministic, no I/O
  rules.ts            26 rejection rules with severity, actor, fix time, citation
  preflight.ts        the runner, plus profileHealth() for record-level checks
  text.ts             name-mismatch classifier — the KIND of mismatch picks the fix
  types.ts, dates.ts

src/lib/passbook.ts   monthly contributions; marks months that should exist and don't
src/lib/documents.ts  6 document generators (declaration, employer letter, grievances…)
src/lib/tracking.ts   claim stages, the 20-day SLA, and the stall model
src/lib/speech.ts     Web Speech wiring and keyword intent routing
src/lib/i18n/         findings.hi.ts (33 entries) + localise.ts
src/lib/i18n.ts       165 interface strings per language

src/app/              11 routes: landing, /integration, /login, /portal/*
src/components/ui.tsx layout primitives — spacing, radius, labels decided once
scripts/              engine, i18n-coverage and passbook audits
```

Two design positions are load-bearing:

**Rules decide; the model only explains.** Every verdict traces to a written rule with
a citation. A citizen told *"your claim will be rejected"* acts on that for three
weeks, and it must not come from a sampled token.

**Documents are templates, not generated.** A Joint Declaration with a hallucinated
field, or a grievance citing a paragraph that does not exist, is worse than none — it
is rejected, and the member loses three more weeks finding out.

The generated letters stay in **English on purpose**, and the interface says so:
EPFO offices and employers act faster on English submissions. The explanation is in
the member's language; the submission is in theirs.

---

## How Codex helped

Codex was the build tool for this project, and it mattered most in three places:

- **Codifying the rule catalogue.** Turning 26 scattered rejection causes — spread
  across scheme paragraphs, circulars, and the literal error strings EPFO returns —
  into one typed, uniform catalogue where every entry carries severity, responsible
  actor, realistic fix time and a citation. This is the part that would have been a
  week of transcription and was the difference between a chatbot and an engine.
- **The parameterised translation layer.** The engine builds its prose inline, so
  switching language originally translated the buttons and left every explanation in
  English. Threading `params` through all 26 rules, writing the Hindi catalogue, and
  building an audit that fails the build on any untranslated finding was a mechanical
  refactor across the whole codebase.
- **The design pass.** Extracting layout primitives and retiring a colour system where
  severity washed entire cards — which turned a page of seven findings into seven
  competing alarms — then propagating that across eleven routes.

Two real bugs surfaced during that work and are worth naming: the claim tracker was
marking day-27 claims **settled**, so the escalation path never appeared (the same
lie the real portal tells), and retiring the `-wash` colour tokens left 13 stale class
references that Tailwind silently compiles to nothing.

## How an OpenAI model raises the ceiling

This prototype **runs no inference**. Voice uses the browser's own speech engine, so
it is free, needs no key, and works on-device. That is a design position, not a budget
constraint — but four jobs are genuinely limited today, and each is exactly what a
model is for. `src/lib/openai.ts` holds a working client for all of them.

| Job | Model | Limitation today | Cost |
|---|---|---|---|
| Understanding what the member said | `gpt-4o-transcribe` | Keyword lookup. *"Paisa chahiye, bacche ki fees bharni hai"* should resolve to an education advance under ¶68K with the seven-year test applied. Code-mixed Hinglish is the normal case here and keyword matching cannot survive it. | ~₹0.25/claim |
| Reading the verdict aloud | `gpt-4o-mini-tts` | On the cheap Android handsets that matter most, Devanagari is often read by a Latin voice and comes out as nonsense. For a member who cannot read the explanation, this is the difference between the product working and not. | ~₹1.70/verdict |
| Rule text in eight languages | `gpt-5-mini` | English and Hindi are complete; six Indian languages are named as pending rather than offered as if they worked. Generated once at build time and shipped in the bundle, so runtime cost is zero and it cannot fail on a bad connection. | ~₹6 **once** |
| Adapting grievances to the case | `gpt-5-mini` | Four templates selected by rule — accurate, and blunt where a case is unusual. The legal skeleton and every citation would stay template-fixed. | ~₹0.10/doc |

**≈ ₹2 of inference per member journey**, against an average claim near ₹1.5 lakh, a
one-in-five rejection rate, and — in Ramesh's case alone — ₹30,917 of tax lost purely
because nobody told him to add a PAN first. Figures are estimates from list pricing at
prototype volume, not a procurement quote.

The offered language list was deliberately cut from eight to two. Six of them changed
only the buttons and left every rule explanation in English, which is worse than
offering two: a member who picks Tamil and gets an English page has been told the
product is not for them.

---

## Sources

- [1-in-5 EPF claim rejections](https://www.businesstoday.in/personal-finance/news/story/epfos-instant-pf-withdrawal-promise-has-a-catch-one-in-five-claims-still-gets-rejected-541466-2026-07-07) · Business Today
- [8.31 crore claims settled, FY26](https://www.newkerala.com/news/a/epfo-settles-record-831-crore-claims-fy26-347.htm)
- [20-day deadline and 12% delay penalty](https://www.outlookmoney.com/retirement/epfo-introduces-faster-claim-settlement-20-day-deadline-12-per-cent-delay-penalty) · Outlook Money
- [Rejection reasons](https://www.outlookmoney.com/retirement/pension/epf-claim-settlement-why-epfo-rejects-the-claims-and-what-subscribers-can-do) · Outlook Money
- EPFO Citizen's Charter; EPF Scheme 1952 (¶68 series, ¶69); EPS 1995 (¶12, ¶14);
  Income-tax Act §192A

## Licence

MIT. No government logo, emblem or branding is used anywhere in this project.
