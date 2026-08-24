import type { Metadata } from "next";
import { Noto_Sans } from "next/font/google";
import "./globals.css";
import { Disclaimer } from "@/components/Disclaimer";

/**
 * Noto Sans carries Latin and Devanagari in one family, so switching language
 * does not switch typeface — and the Devanagari subset is only fetched when a
 * page actually renders Devanagari.
 */
const noto = Noto_Sans({
  variable: "--font-noto",
  subsets: ["latin", "devanagari"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "ClaimSetu — know before you file",
  description:
    "A prototype that checks whether your EPF claim will be rejected before you file it, and tells you exactly who has to fix what.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${noto.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <Disclaimer />
        <div className="flex-1 flex flex-col">{children}</div>
      </body>
    </html>
  );
}
