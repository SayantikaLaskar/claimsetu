import type { MemberProfile, EmploymentSpell } from "@/lib/engine/types";

/**
 * Passbook generation.
 *
 * The EPFO passbook is the one screen members do look at, and it is also the
 * screen that hides the most. It shows what was deposited but not what should
 * have been; a month where the employer deducted and never remitted simply is
 * not there, and an absence is invisible. So this generator produces the months
 * that *should* exist from the employment record, and marks the missing ones
 * rather than omitting them — which is the single change that makes a stolen
 * contribution visible to the person it was stolen from.
 *
 * Contribution split follows the scheme: the member pays 12% of wages, all of
 * which goes to EPF. The employer pays 12%, of which 8.33% goes to the pension
 * fund (capped at the ₹15,000 wage ceiling, so ₹1,250 a month) and the balance
 * to EPF.
 */

const EPS_WAGE_CEILING = 15_000;
const ANNUAL_INTEREST = 0.0825;

export interface PassbookRow {
  /** yyyy-mm */
  month: string;
  employerName: string;
  establishmentId: string;
  wage: number;
  /** Member's own 12%. */
  employeeShare: number;
  /** Employer's share routed to EPF. */
  employerShare: number;
  /** Employer's share routed to the pension fund. */
  pensionShare: number;
  /** True when this month should exist but no remittance was received. */
  missing: boolean;
}

export interface PassbookYear {
  /** Financial year label, e.g. "2025-26". */
  year: string;
  rows: PassbookRow[];
  employeeTotal: number;
  employerTotal: number;
  pensionTotal: number;
  /** Interest credited at the close of the year, on the running balance. */
  interest: number;
  closingBalance: number;
}

function monthsInSpell(s: EmploymentSpell, asOf: string): string[] {
  const out: string[] = [];
  const start = new Date(`${s.doj.slice(0, 7)}-01T00:00:00Z`);
  const endIso = s.doe ?? asOf;
  const end = new Date(`${endIso.slice(0, 7)}-01T00:00:00Z`);
  const cur = new Date(start);
  while (cur <= end) {
    out.push(cur.toISOString().slice(0, 7));
    cur.setUTCMonth(cur.getUTCMonth() + 1);
  }
  return out;
}

/** Indian financial year: April to March. */
function financialYear(month: string): string {
  const [y, m] = month.split("-").map(Number);
  const startYear = m >= 4 ? y : y - 1;
  return `${startYear}-${String((startYear + 1) % 100).padStart(2, "0")}`;
}

export function buildPassbook(m: MemberProfile, asOf: string): PassbookYear[] {
  const rows: PassbookRow[] = [];

  for (const spell of m.spells) {
    for (const month of monthsInSpell(spell, asOf)) {
      const missing = spell.contributionGapMonths.includes(month);
      const wage = spell.monthlyWage;
      const employeeShare = Math.round(wage * 0.12);
      const pensionShare = spell.epsMember
        ? Math.round(Math.min(wage, EPS_WAGE_CEILING) * 0.0833)
        : 0;
      const employerShare = Math.round(wage * 0.12) - pensionShare;

      rows.push({
        month,
        employerName: spell.employerName,
        establishmentId: spell.establishmentId,
        wage,
        employeeShare,
        employerShare,
        pensionShare,
        missing,
      });
    }
  }

  rows.sort((a, b) => (a.month < b.month ? -1 : 1));

  // Group into financial years and credit interest at each year's close.
  const byYear = new Map<string, PassbookRow[]>();
  for (const r of rows) {
    const fy = financialYear(r.month);
    if (!byYear.has(fy)) byYear.set(fy, []);
    byYear.get(fy)!.push(r);
  }

  const years: PassbookYear[] = [];
  let running = 0;

  for (const [year, yearRows] of byYear) {
    const credited = yearRows.filter((r) => !r.missing);
    const employeeTotal = credited.reduce((s, r) => s + r.employeeShare, 0);
    const employerTotal = credited.reduce((s, r) => s + r.employerShare, 0);
    const pensionTotal = credited.reduce((s, r) => s + r.pensionShare, 0);

    // Interest accrues on the opening balance plus roughly half the year's
    // additions, which is close enough to EPFO's monthly running balance method.
    const additions = employeeTotal + employerTotal;
    const interest = Math.round((running + additions / 2) * ANNUAL_INTEREST);
    running += additions + interest;

    years.push({
      year,
      rows: yearRows,
      employeeTotal,
      employerTotal,
      pensionTotal,
      interest,
      closingBalance: running,
    });
  }

  return years.reverse();
}

export interface PassbookSummary {
  /** What the passbook adds up to — EPF only, excluding the pension fund. */
  epfBalance: number;
  pensionFundTotal: number;
  /** Money that should be in the account and is not. */
  missingAmount: number;
  missingMonths: string[];
  totalInterest: number;
}

export function summarise(years: PassbookYear[]): PassbookSummary {
  const allRows = years.flatMap((y) => y.rows);
  const missing = allRows.filter((r) => r.missing);

  return {
    epfBalance: years[0]?.closingBalance ?? 0,
    pensionFundTotal: years.reduce((s, y) => s + y.pensionTotal, 0),
    missingAmount: missing.reduce((s, r) => s + r.employeeShare + r.employerShare + r.pensionShare, 0),
    missingMonths: missing.map((r) => r.month),
    totalInterest: years.reduce((s, y) => s + y.interest, 0),
  };
}
