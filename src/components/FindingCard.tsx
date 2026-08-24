import Link from "next/link";
import type { Finding } from "@/lib/engine/types";
import { type Locale, t } from "@/lib/i18n";
import { severityStyle } from "./ui";
import { SpeakButton } from "./SpeakButton";

/**
 * One rule finding.
 *
 * The order is the opposite of how EPFO reports a rejection. EPFO leads with its
 * own code; this leads with what it means, then who has to act, then what to do.
 * The code and the scheme citation are real and worth having, but they are
 * evidence rather than the message, so they sit behind a disclosure — a page of
 * seven findings has to stay scannable or none of them get read.
 *
 * Severity carries on a thin rule and a small label rather than a coloured
 * surface. Seven washed cards read as seven competing alarms.
 */
export function FindingCard({
  finding,
  locale,
  href,
}: {
  finding: Finding;
  locale: Locale;
  href?: string;
}) {
  const s = severityStyle(finding.severity);
  const spoken = `${finding.title}. ${finding.why}`;

  return (
    <article className="flex gap-0 overflow-hidden rounded-[--radius-card] border border-line bg-card">
      <div className={`w-[3px] shrink-0 ${s.rule}`} aria-hidden />

      <div className="min-w-0 flex-1 p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <p className={`text-[0.7rem] font-bold uppercase tracking-[0.09em] ${s.text}`}>
            {t(locale, `sev.${finding.severity}`)}
          </p>
          <SpeakButton text={spoken} locale={locale} />
        </div>

        <h3 className="mt-1.5 text-[1.02rem] font-bold leading-snug text-ink">
          {finding.title}
        </h3>
        <p className="mt-1.5 text-[0.9rem] leading-relaxed text-ink-soft">{finding.why}</p>

        <p className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-[0.78rem] text-ink-faint">
          <span>
            {t(locale, "check.whoFixes")}{" "}
            <strong className="font-semibold text-ink">
              {t(locale, `actor.${finding.actor}`)}
            </strong>
          </span>
          {finding.typicalDaysToFix > 0 && (
            <span>
              {t(locale, "check.howLong")}{" "}
              <strong className="font-semibold tabular-nums text-ink">
                {finding.typicalDaysToFix} {t(locale, "check.days")}
              </strong>
            </span>
          )}
        </p>

        <ol className="mt-3.5 space-y-2.5 border-t border-line pt-3.5">
          {finding.repair.map((step, i) => (
            <li key={i} className="flex gap-2.5">
              <span className="mt-[0.15rem] flex size-[1.15rem] shrink-0 items-center justify-center rounded-full bg-sunken text-[0.68rem] font-bold tabular-nums text-ink-soft">
                {i + 1}
              </span>
              <div className="min-w-0">
                <p className="text-[0.89rem] leading-relaxed text-ink">{step.text}</p>
                {step.where && (
                  <p className="mt-0.5 text-[0.76rem] text-ink-faint">{step.where}</p>
                )}
                {step.generates && href && (
                  <Link
                    href={href}
                    className="mt-1.5 inline-block text-[0.82rem] font-semibold text-brand underline decoration-brand/40 underline-offset-4"
                  >
                    {t(locale, "check.generate")} →
                  </Link>
                )}
              </div>
            </li>
          ))}
        </ol>

        {(finding.epfoRejectionText || finding.citation) && (
          <details className="mt-3.5 border-t border-line pt-2.5">
            <summary className="cursor-pointer text-[0.78rem] font-semibold text-ink-faint">
              {t(locale, "check.ruleSource")}
            </summary>
            <div className="mt-2 space-y-2">
              {finding.epfoRejectionText && (
                <div>
                  <p className="text-[0.7rem] font-semibold uppercase tracking-[0.09em] text-ink-faint">
                    {t(locale, "check.epfoSays")}
                  </p>
                  <p className="mt-1 rounded border border-line bg-sunken px-2.5 py-2 font-mono text-[0.76rem] leading-snug text-ink-soft">
                    {finding.epfoRejectionText}
                  </p>
                </div>
              )}
              {finding.citation && (
                <p className="text-[0.76rem] leading-relaxed text-ink-faint">
                  <span className="font-semibold">{t(locale, "check.basis")}: </span>
                  {finding.citation}
                </p>
              )}
            </div>
          </details>
        )}
      </div>
    </article>
  );
}
