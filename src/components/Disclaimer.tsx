/**
 * Shown on every screen, above everything.
 *
 * The brief asks that mock data and limitations be disclosed and forbids
 * presenting a prototype as an official government product. A footnote is not
 * disclosure — someone landing mid-journey has to see it — so this lives in the
 * root layout and is not dismissible. Quiet, but never absent.
 */
export function Disclaimer() {
  return (
    <div className="no-print border-b border-line bg-sunken px-4 py-1.5">
      <p className="mx-auto max-w-3xl text-[0.7rem] leading-snug text-ink-faint">
        <strong className="font-semibold text-ink-soft">Prototype.</strong> Not an
        EPFO or Government of India service and not affiliated with either. All
        member records are invented. Nothing is filed anywhere.
      </p>
    </div>
  );
}
