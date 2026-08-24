import { RULES, deriveContext } from "./rules";
import type { ClaimIntent, Finding, MemberProfile, PreflightResult } from "./types";

const SEVERITY_ORDER = { BLOCKER: 0, RISK: 1, ADVISORY: 2 } as const;

/**
 * Run every applicable rule against a member's record and return a verdict.
 *
 * This is the whole product in one function. It is deliberately synchronous,
 * pure, and free of any network or model call: the same inputs always give the
 * same answer, and the answer can be explained line by line. Language models
 * sit *outside* this boundary — they translate and narrate what it returns.
 */
export function preflight(member: MemberProfile, claim: ClaimIntent): PreflightResult {
  const ctx = deriveContext(member, claim);
  const findings: Finding[] = [];
  const passed: string[] = [];

  for (const rule of RULES) {
    const applies = rule.appliesTo === "ALL" || rule.appliesTo.includes(claim.type);
    if (!applies) continue;

    const finding = rule.evaluate(member, claim, ctx);
    if (finding) findings.push(finding);
    else passed.push(rule.label);
  }

  findings.sort((a, b) => {
    const bySeverity = SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity];
    if (bySeverity !== 0) return bySeverity;
    // Within a severity, put the slowest fix first — that is what to start today.
    return b.typicalDaysToFix - a.typicalDaysToFix;
  });

  const blockers = findings.filter((f) => f.severity === "BLOCKER");

  // Eligibility blockers mean "this form is wrong for you", which is a different
  // message from "fix your records": one needs a redirect, the other a to-do list.
  const eligibilityBlocked = blockers.some((f) => f.ruleId.startsWith("ELIG_"));

  // Fixes owned by different actors proceed in parallel; the member's own fixes
  // are sequential in practice because each needs the same employer approval.
  const slowestBlocker = Math.max(0, ...blockers.map((f) => f.typicalDaysToFix));

  return {
    uan: member.uan,
    claim,
    verdict: blockers.length === 0 ? "GO" : eligibilityBlocked ? "NOT_ELIGIBLE" : "FIX_FIRST",
    findings,
    estimatedDaysToReady: slowestBlocker,
    passed,
  };
}

/** Money actually at stake, used to make the cost of a rejection concrete. */
export function amountAtStake(member: MemberProfile, claim: ClaimIntent): number {
  return claim.requestedAmount ?? member.pfBalance;
}

/**
 * Record health, independent of any claim.
 *
 * Runs only the rules that apply to every form — the ones about whether the
 * member's record is internally consistent, rather than whether they qualify for
 * a particular benefit. This is what a member most needs on opening the portal
 * and what no portal shows them: not "here is your balance", but "four things
 * about your record will block anything you try to file".
 *
 * Deliberately not a score out of a hundred. A single unmarked exit date blocks
 * every claim absolutely, and averaging it against nine passing checks into
 * "90% healthy" would be a comfortable lie.
 */
export function profileHealth(
  member: MemberProfile,
  asOf: string,
): {
  findings: Finding[];
  passed: string[];
  blockers: number;
  risks: number;
  advisories: number;
  /** True when nothing about the record itself stands in the way. */
  clean: boolean;
} {
  // Rules that apply to every form are, by construction, the record-level ones.
  const claim: ClaimIntent = { type: "FORM_19", asOf };
  const ctx = deriveContext(member, claim);

  const findings: Finding[] = [];
  const passed: string[] = [];

  for (const rule of RULES) {
    if (rule.appliesTo !== "ALL") continue;
    const f = rule.evaluate(member, claim, ctx);
    if (f) findings.push(f);
    else passed.push(rule.label);
  }

  findings.sort((a, b) => {
    const s = SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity];
    return s !== 0 ? s : b.typicalDaysToFix - a.typicalDaysToFix;
  });

  const count = (s: Finding["severity"]) => findings.filter((f) => f.severity === s).length;

  return {
    findings,
    passed,
    blockers: count("BLOCKER"),
    risks: count("RISK"),
    advisories: count("ADVISORY"),
    clean: count("BLOCKER") === 0 && count("RISK") === 0,
  };
}
