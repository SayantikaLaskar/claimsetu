import { PortalNav } from "./PortalNav";
import { t, type Locale } from "@/lib/i18n";

export function PortalShell({
  locale,
  name,
  uan,
  active,
  children,
}: {
  locale: Locale;
  name: string;
  uan: string;
  active: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <PortalNav locale={locale} name={name} uan={uan} active={active} />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">{children}</main>
      <footer className="border-t border-line px-4 py-5 text-[0.74rem] leading-relaxed text-ink-faint">
        <div className="mx-auto max-w-3xl">{t(locale, "foot.built")}</div>
      </footer>
    </>
  );
}
