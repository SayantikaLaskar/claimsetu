import type { Finding } from "@/lib/engine/types";
import type { Locale } from "@/lib/i18n";
import { FINDINGS_HI, type FindingCopy } from "./findings.hi";

/**
 * Render a finding in the member's language.
 *
 * The engine always produces English, so English needs no work and can never be
 * missing. Any other language is a lookup on the finding's key plus
 * interpolation of the values the rule already handed over. A missing key falls
 * back to English rather than showing a placeholder — a member reading an
 * unfamiliar language is worse served by `{employer}` than by a sentence they
 * can at least ask someone about.
 */

const CATALOGUES: Partial<Record<Locale, Record<string, FindingCopy>>> = {
  hi: FINDINGS_HI,
};

function interpolate(template: string, params: Record<string, string | number> = {}): string {
  return template.replace(/\{(\w+)\}/g, (whole, key: string) =>
    key in params ? String(params[key]) : whole,
  );
}

export function localiseFinding(finding: Finding, locale: Locale): Finding {
  const catalogue = CATALOGUES[locale];
  if (!catalogue) return finding;

  const copy = catalogue[finding.i18nKey ?? finding.ruleId];
  if (!copy) return finding;

  const params = finding.params ?? {};

  return {
    ...finding,
    title: interpolate(copy.title, params),
    why: interpolate(copy.why, params),
    repair: finding.repair.map((step, i) => ({
      ...step,
      // Index-matched, so a shorter translation degrades to English per step
      // rather than dropping a step the member needs.
      text: copy.repair[i] ? interpolate(copy.repair[i], params) : step.text,
      where: copy.where?.[i] ? interpolate(copy.where[i]!, params) : step.where,
    })),
  };
}

export function localiseFindings(findings: Finding[], locale: Locale): Finding[] {
  return findings.map((f) => localiseFinding(f, locale));
}

/** True when this finding has copy in the given language. Used by the audit. */
export function hasCopy(finding: Finding, locale: Locale): boolean {
  const catalogue = CATALOGUES[locale];
  if (!catalogue) return locale === "en";
  return Boolean(catalogue[finding.i18nKey ?? finding.ruleId]);
}
