/**
 * Engine smoke-check. Runs every persona through the claim they would plausibly
 * file and prints the verdict, so the rule catalogue can be audited without the
 * interface in the way. Run: npm run check
 */
import { MEMBERS } from "../src/lib/data/members";
import { preflight } from "../src/lib/engine/preflight";
import type { ClaimIntent } from "../src/lib/engine/types";

const ASOF = "2026-08-24";

const CASES: Array<{ uan: string; claim: ClaimIntent; note: string }> = [
  { uan: "900000000001", claim: { type: "FORM_19", asOf: ASOF }, note: "left job 3 months ago, wants full withdrawal" },
  { uan: "900000000002", claim: { type: "FORM_10D", asOf: ASOF }, note: "believes she has 10 years, applying for pension" },
  { uan: "900000000003", claim: { type: "FORM_10C", asOf: ASOF }, note: "15 years service, trying to cash out pension" },
  { uan: "900000000004", claim: { type: "FORM_19", asOf: ASOF }, note: "employer skipped 3 months of deposits" },
  { uan: "900000000005", claim: { type: "FORM_31", purpose: "ILLNESS", requestedAmount: 120_000, asOf: ASOF }, note: "employed, medical advance" },
  { uan: "900000000005", claim: { type: "FORM_31", purpose: "MARRIAGE", requestedAmount: 400_000, asOf: ASOF }, note: "over the ceiling" },
];

const ICON = { BLOCKER: "✗", RISK: "!", ADVISORY: "·" } as const;

for (const { uan, claim, note } of CASES) {
  const m = MEMBERS[uan];
  const r = preflight(m, claim);
  console.log(`\n${"=".repeat(78)}`);
  console.log(`${m.epfoName}  ·  ${claim.type}${claim.purpose ? ` (${claim.purpose})` : ""}  ·  ${note}`);
  console.log(`verdict: ${r.verdict}   ready in ~${r.estimatedDaysToReady} working days   ${r.passed.length} checks passed`);
  for (const f of r.findings) {
    console.log(`  ${ICON[f.severity]} [${f.actor}] ${f.title}`);
    console.log(`      ${f.why.slice(0, 150)}${f.why.length > 150 ? "…" : ""}`);
  }
}
console.log();
