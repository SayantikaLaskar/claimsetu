import Link from "next/link";
import { signOutAction } from "@/app/login/actions";
import { LOCALES, type Locale } from "@/lib/i18n";

const TABS = [
  { href: "/portal", label: "Home", labelHi: "होम" },
  { href: "/portal/records", label: "My records", labelHi: "मेरा रिकॉर्ड" },
  { href: "/portal/passbook", label: "Passbook", labelHi: "पासबुक" },
  { href: "/portal/claim", label: "Claim money", labelHi: "पैसा निकालें" },
  { href: "/portal/claims", label: "My claims", labelHi: "मेरे क्लेम" },
];

/**
 * Portal chrome.
 *
 * The language control used to sit in a bar of its own below the tabs, which put
 * the least-used control in the most prominent horizontal band on the page and
 * pushed the actual navigation down. It is now a two-item toggle on the identity
 * row, beside sign-out — where a settings control belongs.
 *
 * Tabs and the toggle are links, so navigation works before any JavaScript
 * arrives. On the connection this is built for, that is the difference between a
 * usable page and a blank one.
 */
export function PortalNav({
  locale,
  name,
  uan,
  active,
}: {
  locale: Locale;
  name: string;
  uan: string;
  active: string;
}) {
  return (
    <header className="border-b border-line bg-card">
      <div className="mx-auto max-w-3xl px-4 pt-3">
        {/* Identity row */}
        <div className="flex items-center justify-between gap-4">
          <Link
            href={`/portal?lang=${locale}`}
            className="text-[1.02rem] font-bold tracking-tight text-brand"
          >
            ClaimSetu
          </Link>

          <div className="flex items-center gap-3">
            {/* Language toggle: two links styled as one segmented control. */}
            <div
              role="group"
              aria-label="Language"
              className="flex overflow-hidden rounded-md border border-line-strong"
            >
              {Object.entries(LOCALES).map(([code, meta]) => (
                <Link
                  key={code}
                  href={`${active}?lang=${code}`}
                  aria-current={code === locale ? "true" : undefined}
                  className={`px-2.5 py-1 text-[0.74rem] font-semibold ${
                    code === locale
                      ? "bg-brand text-white"
                      : "bg-card text-ink-faint"
                  }`}
                >
                  {meta.short}
                </Link>
              ))}
            </div>

            <form action={signOutAction}>
              <button
                type="submit"
                className="text-[0.78rem] font-medium text-ink-faint underline underline-offset-2"
              >
                {locale === "hi" ? "साइन आउट" : "Sign out"}
              </button>
            </form>
          </div>
        </div>

        {/* Who is signed in */}
        <p className="mt-0.5 text-[0.76rem] text-ink-faint">
          <span className="font-semibold text-ink-soft">{name}</span>
          <span className="ml-2 font-mono">{uan}</span>
        </p>

        <nav className="-mx-4 mt-2.5 overflow-x-auto px-4">
          <ul className="flex min-w-max gap-1 text-[0.86rem]">
            {TABS.map((tab) => {
              const on = tab.href === active;
              return (
                <li key={tab.href}>
                  <Link
                    href={`${tab.href}?lang=${locale}`}
                    aria-current={on ? "page" : undefined}
                    className={`block border-b-2 px-3 py-2.5 font-medium ${
                      on
                        ? "border-brand text-brand"
                        : "border-transparent text-ink-soft"
                    }`}
                  >
                    {locale === "hi" ? tab.labelHi : tab.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </header>
  );
}
