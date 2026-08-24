import Link from "next/link";
import { MEMBERS } from "@/lib/data/members";
import { PERSONAS } from "@/lib/data/personas";
import { MOCK_CREDENTIALS } from "@/lib/session";
import { formatRupees } from "@/lib/engine/dates";
import { signInAction } from "./actions";
import { one } from "@/lib/locale";

/**
 * Sign-in.
 *
 * Laid out the way the real member portal is, because the demo is more
 * persuasive if the starting point is familiar. The credentials are printed
 * beside the form on purpose: a reviewer with two minutes should never have to
 * hunt for a password, and there is nothing here worth protecting.
 */
export default async function Login({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const failed = one(sp.error) === "1";
  const prefill = one(sp.uan) ?? "";

  return (
    <div className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">
      <Link href="/" className="text-[0.85rem] font-medium text-ink-soft">
        ← ClaimSetu
      </Link>

      <div className="mt-6 grid gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        <div>
          <h1 className="text-[1.5rem] font-bold leading-tight tracking-tight">
            Member sign-in
          </h1>
          <p className="mt-2 text-[0.92rem] leading-relaxed text-ink-soft">
            Universal Account Number and password, as on the real member portal.
            Nothing you type here leaves this page.
          </p>

          <form action={signInAction} className="mt-6 space-y-4">
            <div>
              <label htmlFor="uan" className="block text-[0.88rem] font-semibold text-ink">
                UAN
              </label>
              <input
                id="uan"
                name="uan"
                inputMode="numeric"
                autoComplete="username"
                required
                defaultValue={prefill}
                placeholder="12 digits"
                className="mt-1.5 w-full rounded-lg border border-line-strong bg-card px-3.5 py-3 font-mono text-[1.02rem] tabular-nums text-ink"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-[0.88rem] font-semibold text-ink">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="mt-1.5 w-full rounded-lg border border-line-strong bg-card px-3.5 py-3 text-[1.02rem] text-ink"
              />
            </div>

            {failed && (
              <p
                role="alert"
                className="rounded-lg border border-stop/40 bg-sunken px-3.5 py-3 text-[0.88rem] leading-relaxed text-ink"
              >
                That UAN and password do not match. Pick a member from the list
                and use the password shown beside it.
              </p>
            )}

            <button
              type="submit"
              className="w-full rounded-lg bg-brand px-4 py-3.5 text-[1.02rem] font-semibold text-white"
            >
              Sign in
            </button>
          </form>

          <p className="mt-4 rounded-lg border border-warn/40 bg-sunken px-3.5 py-3 text-[0.82rem] leading-relaxed text-ink">
            <strong className="font-semibold">Mock sign-in.</strong> The real
            portal also offers an Aadhaar OTP route. This prototype does not
            contact UIDAI, EPFO or any other system, and stores nothing but which
            demo record you chose.
          </p>
        </div>

        <div>
          <h2 className="text-[0.7rem] font-semibold uppercase tracking-[0.09em] text-ink-faint">
            Pick a member &middot; tap to fill
          </h2>
          <p className="mt-1.5 text-[0.85rem] leading-relaxed text-ink-faint">
            Five invented records. Each one fails differently, and each one is
            worth seeing.
          </p>

          <ul className="mt-4 space-y-3">
            {PERSONAS.map((p) => {
              const m = MEMBERS[p.uan];
              return (
                <li
                  key={p.uan}
                  className="rounded-lg border border-line bg-card p-3.5"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                    <span className="font-semibold text-ink">{p.name}</span>
                    <span className="text-[0.82rem] font-medium tabular-nums text-brand">
                      {formatRupees(m.pfBalance)}
                    </span>
                  </div>
                  <p className="mt-1 text-[0.85rem] leading-snug text-ink-soft">
                    {p.blurb}
                  </p>
                  <p className="mt-2 text-[0.78rem] leading-snug text-ink-faint">
                    {p.demonstrates}
                  </p>

                  <form action={signInAction} className="mt-3 flex items-center gap-2">
                    <input type="hidden" name="uan" value={p.uan} />
                    <input
                      type="hidden"
                      name="password"
                      value={MOCK_CREDENTIALS[p.uan].password}
                    />
                    <button
                      type="submit"
                      className="rounded-lg border border-brand px-3 py-2 text-[0.84rem] font-semibold text-brand"
                    >
                      Sign in as {p.name.split(" ")[0]}
                    </button>
                    <code className="min-w-0 truncate font-mono text-[0.74rem] text-ink-faint">
                      {p.uan} / {MOCK_CREDENTIALS[p.uan].password}
                    </code>
                  </form>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
