/**
 * Engine tests.
 *
 * `scripts/check.ts` prints verdicts, which is useful for reading but proves
 * nothing — a rule could silently stop firing and the output would still look
 * plausible. These assert the behaviour that the whole product rests on: that a
 * claim which would be rejected is reported as such, that the responsible party
 * is named correctly, and that no arithmetic drifts.
 *
 * Run: npm test
 */
import { test } from "node:test";
import assert from "node:assert/strict";

import { MEMBERS } from "../src/lib/data/members";
import { preflight, profileHealth, amountAtStake } from "../src/lib/engine/preflight";
import { RULES } from "../src/lib/engine/rules";
import { compareNames, nameWouldFailEpfo } from "../src/lib/engine/text";
import { buildPassbook, summarise } from "../src/lib/passbook";
import { claimState, slaStatus, SLA_DAYS, STAGES } from "../src/lib/tracking";
import { generateDocument, delayGrievance } from "../src/lib/documents";
import { localiseFinding, hasCopy } from "../src/lib/i18n/localise";
import type { ClaimIntent } from "../src/lib/engine/types";

const ASOF = "2026-08-24";
const RAMESH = MEMBERS["900000000001"];
const SUNITA = MEMBERS["900000000002"];
const IRFAN = MEMBERS["900000000003"];
const GANESH = MEMBERS["900000000004"];
const LAKSHMI = MEMBERS["900000000005"];

/* ─────────────────────────── name matching ─────────────────────────── */

test("name matcher distinguishes the kinds of mismatch, since each has a different fix", () => {
  assert.equal(compareNames("RAMESH KUMAR YADAV", "Ramesh Kumar Yadav"), "EXACT");
  assert.equal(compareNames("RAMESH K YADAV", "RAMESH KUMAR YADAV"), "INITIAL_EXPANSION");
  assert.equal(compareNames("YADAV RAMESH KUMAR", "RAMESH KUMAR YADAV"), "REORDERED");
  assert.equal(compareNames("RAMESH YADAV", "RAMESH KUMAR YADAV"), "TOKEN_MISSING");
  assert.equal(compareNames("SUNIL VERMA", "PRIYA IYER"), "DIFFERENT");
});

test("honorifics and punctuation do not count as a mismatch", () => {
  assert.equal(compareNames("Shri Ramesh Kumar Yadav", "RAMESH KUMAR YADAV."), "EXACT");
  assert.equal(nameWouldFailEpfo(compareNames("Smt. Sunita Devi", "SUNITA DEVI")), false);
});

/* ─────────────────────────── verdicts ─────────────────────────── */

test("Ramesh cannot file a final settlement — records disagree, employer has not exited him", () => {
  const r = preflight(RAMESH, { type: "FORM_19", asOf: ASOF });
  assert.equal(r.verdict, "FIX_FIRST");

  const ids = r.findings.map((f) => f.ruleId);
  assert.ok(ids.includes("KYC_NAME_MISMATCH"), "expected the Aadhaar name mismatch");
  assert.ok(ids.includes("SERVICE_EXIT_DATE_MISSING"), "expected the unmarked exit date");
  assert.ok(ids.includes("KYC_BANK_NAME_MISMATCH"), "expected the bank name mismatch");

  // The point of the product: the exit date is not the member's job to fix.
  const exit = r.findings.find((f) => f.ruleId === "SERVICE_EXIT_DATE_MISSING")!;
  assert.equal(exit.actor, "EMPLOYER");
  assert.equal(exit.severity, "BLOCKER");
});

test("a clean record on an eligible advance returns GO", () => {
  const r = preflight(LAKSHMI, {
    type: "FORM_31", purpose: "ILLNESS", requestedAmount: 120_000, asOf: ASOF,
  });
  assert.equal(r.verdict, "GO");
  assert.equal(r.findings.filter((f) => f.severity === "BLOCKER").length, 0);
  assert.equal(r.estimatedDaysToReady, 0);
});

test("an over-ceiling advance is refused outright, not part-paid", () => {
  const r = preflight(LAKSHMI, {
    type: "FORM_31", purpose: "MARRIAGE", requestedAmount: 400_000, asOf: ASOF,
  });
  assert.equal(r.verdict, "NOT_ELIGIBLE");
  assert.ok(r.findings.some((f) => f.ruleId === "ELIG_31_CEILING"));
});

test("past ten years the pension cannot be cashed out, and the member is redirected", () => {
  const r = preflight(IRFAN, { type: "FORM_10C", asOf: ASOF });
  assert.equal(r.verdict, "NOT_ELIGIBLE");
  assert.ok(r.findings.some((f) => f.ruleId === "ELIG_10C_SERVICE_TOO_LONG"));
});

test("Sunita's split service is surfaced, not silently counted short", () => {
  const r = preflight(SUNITA, { type: "FORM_10D", asOf: ASOF });
  const ids = r.findings.map((f) => f.ruleId);
  assert.ok(ids.includes("ELIG_10D_SERVICE_SHORT"), "she is short of ten years");
  assert.ok(ids.includes("SERVICE_UNMERGED_UAN"), "and told why — a second UAN exists");
  assert.ok(ids.includes("SERVICE_NOT_TRANSFERRED"), "and that past service is uncounted");
});

test("a non-deposit by the employer is attributed to the employer", () => {
  const r = preflight(GANESH, { type: "FORM_19", asOf: ASOF });
  const gap = r.findings.find((f) => f.ruleId === "SERVICE_CONTRIBUTION_GAP");
  assert.ok(gap, "expected the contribution gap");
  assert.equal(gap.actor, "EMPLOYER");
  assert.match(gap.why, /2025-11/);
});

/* ─────────────────────────── invariants ─────────────────────────── */

test("blockers always sort above risks, so the page leads with what stops the claim", () => {
  for (const m of Object.values(MEMBERS)) {
    const r = preflight(m, { type: "FORM_19", asOf: ASOF });
    const order = r.findings.map((f) => ({ BLOCKER: 0, RISK: 1, ADVISORY: 2 })[f.severity]);
    assert.deepEqual(order, [...order].sort((a, b) => a - b), `unsorted for ${m.uan}`);
  }
});

test("every finding names an actor, a fix, and a rule id", () => {
  for (const m of Object.values(MEMBERS)) {
    for (const type of ["FORM_19", "FORM_10C", "FORM_31", "FORM_10D"] as const) {
      const claim: ClaimIntent = type === "FORM_31"
        ? { type, purpose: "ILLNESS", requestedAmount: 50_000, asOf: ASOF }
        : { type, asOf: ASOF };
      for (const f of preflight(m, claim).findings) {
        assert.ok(f.ruleId, "missing ruleId");
        assert.ok(["MEMBER", "EMPLOYER", "EPFO", "BANK"].includes(f.actor), `bad actor on ${f.ruleId}`);
        assert.ok(f.repair.length > 0, `${f.ruleId} states a problem with no fix`);
        assert.ok(f.title.length > 0 && f.why.length > 0, `${f.ruleId} has empty copy`);
      }
    }
  }
});

test("rule ids are unique — a duplicate would silently shadow a check", () => {
  const ids = RULES.map((r) => r.id);
  assert.equal(new Set(ids).size, ids.length);
});

test("record-level health uses only rules that apply to every form", () => {
  const h = profileHealth(RAMESH, ASOF);
  assert.ok(h.findings.length > 0);
  assert.equal(h.clean, false);
  // No form-specific eligibility rule may leak into a record-level check.
  assert.ok(!h.findings.some((f) => f.ruleId.startsWith("ELIG_")));
});

/* ─────────────────────────── passbook ─────────────────────────── */

test("the stated balance is the passbook's own closing balance, never asserted separately", () => {
  for (const m of Object.values(MEMBERS)) {
    const s = summarise(buildPassbook(m, ASOF));
    assert.equal(m.pfBalance, s.epfBalance, `${m.epfoName} balance does not reconcile`);
  }
});

test("months deducted but never deposited are counted, not omitted", () => {
  const s = summarise(buildPassbook(GANESH, ASOF));
  assert.equal(s.missingMonths.length, 3);
  assert.deepEqual(s.missingMonths, ["2025-11", "2025-12", "2026-01"]);
  assert.ok(s.missingAmount > 0);
  // A missing month must not be credited to the balance.
  const clean = summarise(buildPassbook({ ...GANESH, spells: GANESH.spells.map((sp) => ({ ...sp, contributionGapMonths: [] })) }, ASOF));
  assert.ok(clean.epfBalance > s.epfBalance, "the gap should reduce the balance");
});

test("pension contribution is capped at the wage ceiling", () => {
  // Sunita's second spell pays above ₹15,000, so EPS must cap at ₹1,250/month.
  const rows = buildPassbook(SUNITA, ASOF).flatMap((y) => y.rows);
  const above = rows.filter((r) => r.wage > 15_000 && !r.missing);
  assert.ok(above.length > 0, "expected wages above the ceiling in this fixture");
  for (const r of above) assert.ok(r.pensionShare <= 1_250, `pension share ${r.pensionShare} exceeds the cap`);
});

/* ─────────────────────────── tracking ─────────────────────────── */

test("a claim past the twenty-day promise is stalled, never shown as settled", () => {
  const late = claimState(SLA_DAYS + 7);
  assert.equal(late.stalled, true);
  assert.notEqual(STAGES[late.stageIndex].id, "SETTLED");
  assert.equal(slaStatus(SLA_DAYS + 7).breached, true);
  assert.equal(slaStatus(SLA_DAYS + 7).daysOver, 7);
});

test("a claim inside the promise progresses and is not marked breached", () => {
  const early = claimState(3);
  assert.equal(early.stalled, false);
  assert.equal(slaStatus(3).breached, false);
  assert.equal(slaStatus(3).daysRemaining, SLA_DAYS - 3);
});

/* ─────────────────────────── documents ─────────────────────────── */

test("the employer letter carries the establishment and the member's own details", () => {
  const f = preflight(RAMESH, { type: "FORM_19", asOf: ASOF })
    .findings.find((x) => x.ruleId === "SERVICE_EXIT_DATE_MISSING")!;
  const doc = generateDocument("EMPLOYER_EXIT_REQUEST", RAMESH, f, ASOF);
  assert.match(doc.body, /Sunrise Auto Components/);
  assert.match(doc.body, /MHBAN0045678000/);
  assert.match(doc.body, new RegExp(RAMESH.uan));
  assert.ok(doc.delivery.length > 0, "a document with no delivery route is not actionable");
});

test("the non-deposit grievance names the months and the offence, not a generic complaint", () => {
  const f = preflight(GANESH, { type: "FORM_19", asOf: ASOF })
    .findings.find((x) => x.ruleId === "SERVICE_CONTRIBUTION_GAP")!;
  const doc = generateDocument("GRIEVANCE", GANESH, f, ASOF);
  assert.match(doc.body, /2025-11/);
  assert.match(doc.body, /not a\s+delay in administration/);
  assert.match(doc.body, /twenty\s+days/);
});

test("the delay escalation quotes the reference and the elapsed count", () => {
  const doc = delayGrievance(RAMESH, {
    reference: "PUPUN2026190000001", daysElapsed: 27,
    formName: "Form 19", amount: 154_585, asOf: ASOF,
  });
  assert.match(doc.body, /PUPUN2026190000001/);
  assert.match(doc.body, /27 working days/);
});

/* ─────────────────────────── translation ─────────────────────────── */

test("every reachable finding has Hindi copy and no unresolved placeholder", () => {
  for (const m of Object.values(MEMBERS)) {
    for (const type of ["FORM_19", "FORM_10C", "FORM_31", "FORM_10D", "FORM_5IF"] as const) {
      const claim: ClaimIntent = type === "FORM_31"
        ? { type, purpose: "EDUCATION", requestedAmount: 50_000, asOf: ASOF }
        : { type, asOf: ASOF };
      for (const f of [...preflight(m, claim).findings, ...profileHealth(m, ASOF).findings]) {
        assert.ok(hasCopy(f, "hi"), `no Hindi copy for ${f.i18nKey ?? f.ruleId}`);
        const hi = localiseFinding(f, "hi");
        for (const field of [hi.title, hi.why, ...hi.repair.map((r) => r.text)]) {
          assert.doesNotMatch(field, /\{\w+\}/, `unresolved placeholder in ${f.ruleId}: ${field}`);
        }
        assert.notEqual(hi.title, f.title, `${f.ruleId} title did not translate`);
      }
    }
  }
});

test("an unknown locale falls back to English rather than showing placeholders", () => {
  const f = preflight(RAMESH, { type: "FORM_19", asOf: ASOF }).findings[0];
  const same = localiseFinding(f, "en");
  assert.equal(same.title, f.title);
});

/* ─────────────────────────── money ─────────────────────────── */

test("the amount at stake is the requested figure, or the whole balance for a settlement", () => {
  assert.equal(amountAtStake(RAMESH, { type: "FORM_19", asOf: ASOF }), RAMESH.pfBalance);
  assert.equal(
    amountAtStake(LAKSHMI, { type: "FORM_31", purpose: "ILLNESS", requestedAmount: 120_000, asOf: ASOF }),
    120_000,
  );
});
