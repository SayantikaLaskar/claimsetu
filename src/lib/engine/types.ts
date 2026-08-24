/**
 * Domain types for the ClaimSetu pre-flight engine.
 *
 * Design note: every verdict in this system is produced by deterministic rules
 * (see ./rules.ts), never by a language model. The model is used only to
 * *explain* a verdict in the member's language and to draft letters. A citizen
 * must never be told "your claim will pass" by a probabilistic system.
 */

export type KycStatus = "VERIFIED" | "PENDING" | "ABSENT" | "REJECTED";

/** The five EPFO claim forms that account for nearly all member claims. */
export type ClaimType =
  | "FORM_19"   // Final settlement of PF
  | "FORM_10C"  // Withdrawal benefit / Scheme Certificate (service < 10 yrs)
  | "FORM_31"   // Partial advance against PF
  | "FORM_10D"  // Monthly pension (service >= 10 yrs, age >= 50/58)
  | "FORM_5IF"; // EDLI insurance claim (death of member)

/** Purposes EPFO accepts for a Form 31 advance, each with its own rules. */
export type AdvancePurpose =
  | "ILLNESS"
  | "EDUCATION"
  | "MARRIAGE"
  | "HOUSE_PURCHASE"
  | "HOUSE_REPAIR"
  | "HOUSING_LOAN_REPAY"
  | "UNEMPLOYMENT"
  | "NATURAL_CALAMITY";

export interface EmploymentSpell {
  employerName: string;
  establishmentId: string;
  /** Date of joining, ISO yyyy-mm-dd. */
  doj: string;
  /** Date of exit. null means the employer has not marked an exit date. */
  doe: string | null;
  /** Whether the member was enrolled in the Employees' Pension Scheme. */
  epsMember: boolean;
  /** EPF wage at exit, in rupees per month. */
  monthlyWage: number;
  /** Months (yyyy-mm) where the employer filed no ECR / deposited nothing. */
  contributionGapMonths: string[];
  /** Last month (yyyy-mm) for which a contribution was actually credited. */
  lastContributionMonth: string | null;
  /** Has this spell's service been transferred into the current UAN? */
  transferredIntoCurrentUan: boolean;
}

export interface BankDetails {
  status: KycStatus;
  accountNumber: string;
  ifsc: string;
  /** Name as printed on the bank record. */
  nameOnAccount: string;
  /** True when the IFSC belongs to a bank that has since been merged/renamed. */
  ifscBelongsToMergedBank: boolean;
}

/**
 * Everything the engine needs about one member. In the prototype this is
 * populated from mock EPFO records (see src/lib/data/members.ts); in production
 * every field here maps to something EPFO already holds.
 */
export interface MemberProfile {
  uan: string;
  /** Name as it appears in EPFO's own member record. */
  epfoName: string;
  /** Name as it appears in the Aadhaar demographic record. */
  aadhaarName: string;
  epfoDob: string;
  aadhaarDob: string;
  epfoFatherName: string;
  aadhaarFatherName: string;
  epfoGender: "M" | "F" | "T";
  aadhaarGender: "M" | "F" | "T";

  aadhaarKyc: KycStatus;
  panKyc: KycStatus;
  bank: BankDetails;

  /** Aadhaar-linked mobile — required for the OTP that authorises a claim. */
  mobileLinkedToAadhaar: boolean;

  /** Employment history known to EPFO under this UAN. */
  spells: EmploymentSpell[];
  /** Other UANs discovered for this member that were never merged. */
  unmergedUans: string[];

  /** Whether a nomination (e-Nomination) has been filed and approved. */
  eNominationFiled: boolean;

  /** Whether the employer has an active digital signature registered with EPFO. */
  employerDscActive: boolean;

  /** Any claim already in flight for this UAN, by form. */
  claimsInProgress: ClaimType[];

  /** Date the member stopped working, if unemployed. */
  unemployedSince: string | null;

  /** Member's own accumulated PF balance, in rupees. */
  pfBalance: number;
}

export interface ClaimIntent {
  type: ClaimType;
  purpose?: AdvancePurpose;
  requestedAmount?: number;
  /** Today's date, injected so the engine stays pure and testable. */
  asOf: string;
}

/** Who has to act to clear a blocker. This is the field citizens never get told. */
export type Actor = "MEMBER" | "EMPLOYER" | "EPFO" | "BANK";

export type Severity =
  /** Claim will be rejected. Do not file. */
  | "BLOCKER"
  /** Claim may be rejected or partly paid, or will be delayed. */
  | "RISK"
  /** No effect on this claim, but will bite on a future one. */
  | "ADVISORY";

export interface RepairStep {
  text: string;
  /** Where this step happens, in words a first-time user can act on. */
  where?: string;
  /** A document or draft ClaimSetu can generate for this step. */
  generates?: "JOINT_DECLARATION" | "EMPLOYER_EXIT_REQUEST" | "UAN_MERGE_REQUEST" | "GRIEVANCE" | "KYC_CHECKLIST";
}

export interface Finding {
  ruleId: string;
  /**
   * Key for the translated copy, when one rule produces several messages.
   * A name mismatch reads differently depending on *how* the names differ, and
   * a missing nominee is a blocker on a death claim and a footnote otherwise.
   * Defaults to ruleId.
   */
  i18nKey?: string;
  /**
   * The values interpolated into this finding's text.
   *
   * The English prose below is built by the rule itself; these are the same
   * values, handed over separately so another language can be rendered from a
   * template rather than re-deriving the logic. Without this, translating the
   * engine would mean forking it.
   */
  params?: Record<string, string | number>;
  severity: Severity;
  /** One line, no jargon, addressed to the member. */
  title: string;
  /** Why EPFO will reject this, in plain terms. */
  why: string;
  /** The literal rejection text EPFO tends to return, so members recognise it. */
  epfoRejectionText?: string;
  actor: Actor;
  repair: RepairStep[];
  /** Realistic working days to clear, so nobody is promised three days. */
  typicalDaysToFix: number;
  /** The rule, circular, or scheme paragraph this is grounded in. */
  citation?: string;
}

export interface PreflightResult {
  uan: string;
  claim: ClaimIntent;
  /** GO when nothing blocking remains. */
  verdict: "GO" | "FIX_FIRST" | "NOT_ELIGIBLE";
  findings: Finding[];
  /** Longest actor-chain in working days, i.e. realistic time to a clean file. */
  estimatedDaysToReady: number;
  /** Rules that were evaluated and passed — shown so the check is auditable. */
  passed: string[];
}
