/**
 * Translation coverage audit.
 *
 * Runs every persona through every claim form and purpose, collects each
 * distinct finding key the engine can emit, and reports any that has no Hindi
 * copy. This is the guard against the exact failure this work was fixing:
 * an interface that switches language and silently leaves the important half in
 * English. Run: npm run i18n
 */
import { MEMBERS } from "../src/lib/data/members";
import { preflight, profileHealth } from "../src/lib/engine/preflight";
import { hasCopy } from "../src/lib/i18n/localise";
import type { AdvancePurpose, ClaimType, Finding } from "../src/lib/engine/types";

const ASOF = "2026-08-24";
const FORMS: ClaimType[] = ["FORM_19", "FORM_10C", "FORM_31", "FORM_10D", "FORM_5IF"];
const PURPOSES: AdvancePurpose[] = [
  "ILLNESS", "EDUCATION", "MARRIAGE", "HOUSE_PURCHASE",
  "HOUSE_REPAIR", "HOUSING_LOAN_REPAY", "UNEMPLOYMENT", "NATURAL_CALAMITY",
];

const seen = new Map<string, Finding>();

for (const member of Object.values(MEMBERS)) {
  for (const f of profileHealth(member, ASOF).findings) {
    seen.set(f.i18nKey ?? f.ruleId, f);
  }
  for (const type of FORMS) {
    const variants = type === "FORM_31"
      ? PURPOSES.map((purpose) => ({ type, purpose, requestedAmount: 500_000, asOf: ASOF }))
      : [{ type, asOf: ASOF }];
    for (const claim of variants) {
      for (const f of preflight(member, claim).findings) {
        seen.set(f.i18nKey ?? f.ruleId, f);
      }
    }
  }
}

const missing: string[] = [];
for (const [key, finding] of seen) {
  if (!hasCopy(finding, "hi")) missing.push(key);
}

console.log(`reachable finding keys: ${seen.size}`);
console.log(`translated to Hindi   : ${seen.size - missing.length}`);

// Placeholders that survive interpolation mean a template names a param the rule
// never supplies — visible to the member as literal braces.
const unresolved: string[] = [];
for (const [key, f] of seen) {
  const params = f.params ?? {};
  for (const field of [f.title, f.why, ...f.repair.map((r) => r.text)]) {
    for (const m of field.matchAll(/\{(\w+)\}/g)) {
      if (!(m[1] in params)) unresolved.push(`${key} → {${m[1]}}`);
    }
  }
}

if (missing.length) {
  console.log(`\nMISSING Hindi copy:\n  ${missing.join("\n  ")}`);
}
if (unresolved.length) {
  console.log(`\nUNRESOLVED placeholders:\n  ${[...new Set(unresolved)].join("\n  ")}`);
}
if (!missing.length && !unresolved.length) {
  console.log("\nAll reachable findings have Hindi copy, no unresolved placeholders.");
}
process.exit(missing.length || unresolved.length ? 1 : 0);
