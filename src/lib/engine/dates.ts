/** Date helpers. All dates are ISO yyyy-mm-dd; all months are yyyy-mm. */

export function toDate(iso: string): Date {
  return new Date(`${iso}T00:00:00Z`);
}

export function daysBetween(fromIso: string, toIso: string): number {
  return Math.floor((toDate(toIso).getTime() - toDate(fromIso).getTime()) / 86_400_000);
}

export function monthsBetween(fromIso: string, toIso: string): number {
  const a = toDate(fromIso);
  const b = toDate(toIso);
  let months = (b.getUTCFullYear() - a.getUTCFullYear()) * 12 + (b.getUTCMonth() - a.getUTCMonth());
  if (b.getUTCDate() < a.getUTCDate()) months -= 1;
  return months;
}

/** Month key (yyyy-mm) for an ISO date. */
export function monthOf(iso: string): string {
  return iso.slice(0, 7);
}

export function formatIndianDate(iso: string): string {
  const d = toDate(iso);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

/** Rupees, Indian grouping, no decimals — how amounts are read aloud in India. */
export function formatRupees(paise: number): string {
  return `₹${Math.round(paise).toLocaleString("en-IN")}`;
}
