import type {
  ClaimIntent, ClaimType, Finding, MemberProfile, AdvancePurpose,
} from "./types";
import { compareNames, nameWouldFailEpfo } from "./text";
import { formatIndianDate, formatRupees, monthsBetween, monthOf } from "./dates";

/**
 * The rejection-rule catalogue.
 *
 * Each entry encodes one reason EPFO actually rejects a member claim, together
 * with who has to act and how long that realistically takes. The catalogue is
 * the point of this project: EPFO already holds every input these rules need,
 * and already applies equivalent logic — but it applies it *after* the member
 * files, and reports the result as a code weeks later. Running the same logic
 * before filing turns a 20-day rejection into a 10-minute fix.
 *
 * PROVENANCE: rules are derived from published EPFO scheme paragraphs, the
 * EPFO Citizen's Charter, and the rejection reasons EPFO returns on the member
 * portal. Ceilings and service thresholds are simplified in this prototype and
 * are flagged as such in the UI — see `simplified` on each rule.
 */

export interface DerivedContext {
  /** Total pensionable/eligible service across all spells known to this UAN. */
  serviceMonths: number;
  /** Service counted only from spells already merged into this UAN. */
  mergedServiceMonths: number;
  activeSpell: MemberProfile["spells"][number] | undefined;
  latestExitedSpell: MemberProfile["spells"][number] | undefined;
  ageYears: number;
  /** Member's own share of the balance, which is what advances are drawn from. */
  memberShare: number;
  /** Monthly basic+DA proxy, used for advance ceilings. */
  monthlyWage: number;
}

export function deriveContext(p: MemberProfile, c: ClaimIntent): DerivedContext {
  const spellMonths = (s: MemberProfile["spells"][number]) =>
    monthsBetween(s.doj, s.doe ?? c.asOf);

  const serviceMonths = p.spells.reduce((sum, s) => sum + spellMonths(s), 0);
  const mergedServiceMonths = p.spells
    .filter((s) => s.transferredIntoCurrentUan)
    .reduce((sum, s) => sum + spellMonths(s), 0);

  const activeSpell = p.spells.find((s) => s.doe === null);
  const exited = p.spells.filter((s) => s.doe !== null).sort((a, b) => (a.doe! < b.doe! ? 1 : -1));

  return {
    serviceMonths,
    mergedServiceMonths,
    activeSpell,
    latestExitedSpell: exited[0],
    ageYears: Math.floor(monthsBetween(p.epfoDob, c.asOf) / 12),
    // Member share ≈ 12% of wage vs 3.67% employer share to PF → ~76.6% of the corpus.
    memberShare: Math.round(p.pfBalance * 0.766),
    monthlyWage: activeSpell?.monthlyWage ?? exited[0]?.monthlyWage ?? 0,
  };
}

export interface Rule {
  id: string;
  /** Short internal label, shown in the auditable "checks run" list. */
  label: string;
  appliesTo: ClaimType[] | "ALL";
  /** True when the published rule is simplified in this prototype. */
  simplified?: boolean;
  evaluate: (p: MemberProfile, c: ClaimIntent, ctx: DerivedContext) => Finding | null;
}

/* ────────────────────────── identity and KYC ────────────────────────── */

const nameRule: Rule = {
  id: "KYC_NAME_MISMATCH",
  label: "Name matches Aadhaar exactly",
  appliesTo: "ALL",
  evaluate: (p) => {
    const verdict = compareNames(p.epfoName, p.aadhaarName);
    if (!nameWouldFailEpfo(verdict)) return null;

    // The repair path genuinely differs by *kind* of mismatch, which is why we
    // classify rather than just flagging "names differ".
    const explain: Record<string, string> = {
      INITIAL_EXPANSION: `EPFO has your name as "${p.epfoName}" but Aadhaar spells it out as "${p.aadhaarName}". EPFO matches letter by letter, so an initial instead of the full name is enough to fail.`,
      REORDERED: `EPFO has "${p.epfoName}", Aadhaar has "${p.aadhaarName}" — the same words in a different order. EPFO does not reorder names before matching.`,
      TOKEN_MISSING: `Aadhaar has a part of your name that EPFO does not: "${p.epfoName}" vs "${p.aadhaarName}". A missing middle name or surname fails the match.`,
      SPELLING: `Your name is spelt differently in the two records: "${p.epfoName}" vs "${p.aadhaarName}".`,
      DIFFERENT: `The name on your EPFO record ("${p.epfoName}") and on Aadhaar ("${p.aadhaarName}") do not look like the same name. This needs to be checked before anything else.`,
    };

    return {
      ruleId: "KYC_NAME_MISMATCH",
      i18nKey: `KYC_NAME_MISMATCH:${verdict}`,
      params: { epfoName: p.epfoName, aadhaarName: p.aadhaarName },
      severity: "BLOCKER",
      title: "Your name does not match Aadhaar",
      why: explain[verdict] ?? explain.DIFFERENT,
      epfoRejectionText: "Claim rejected: Member name not matching as per Aadhaar / Name differs from UIDAI records",
      actor: "MEMBER",
      repair: [
        {
          text: "File a Joint Declaration to correct your name in the EPFO record. We have filled it for you — you and your employer both sign it.",
          where: "EPFO member portal → Manage → Joint Declaration",
          generates: "JOINT_DECLARATION",
        },
        {
          text: "Your employer must approve the declaration before EPFO looks at it. Chase this — it is the step that stalls.",
          where: "Employer's EPFO login",
        },
      ],
      typicalDaysToFix: 21,
      citation: "EPFO circular on Joint Declaration for correction of member details (2023); Aadhaar-based e-KYC matching",
    };
  },
};

const dobRule: Rule = {
  id: "KYC_DOB_MISMATCH",
  label: "Date of birth matches Aadhaar",
  appliesTo: "ALL",
  evaluate: (p) => {
    if (p.epfoDob === p.aadhaarDob) return null;
    return {
      ruleId: "KYC_DOB_MISMATCH",
      params: { epfoDob: formatIndianDate(p.epfoDob), aadhaarDob: formatIndianDate(p.aadhaarDob) },
      severity: "BLOCKER",
      title: "Your date of birth does not match Aadhaar",
      why: `EPFO has ${formatIndianDate(p.epfoDob)}, Aadhaar has ${formatIndianDate(p.aadhaarDob)}. Any difference stops the claim, and for a pension claim it also changes the date you become eligible.`,
      epfoRejectionText: "Claim rejected: Date of Birth not matching with UIDAI records",
      actor: "MEMBER",
      repair: [
        {
          text: "Correct the date of birth through a Joint Declaration. EPFO allows a correction of up to three years against Aadhaar as proof.",
          where: "EPFO member portal → Manage → Joint Declaration",
          generates: "JOINT_DECLARATION",
        },
      ],
      typicalDaysToFix: 21,
      citation: "EPFO SOP on correction of member profile, version 3.0",
    };
  },
};

const fatherNameRule: Rule = {
  id: "KYC_RELATION_NAME_MISMATCH",
  label: "Father's / husband's name matches Aadhaar",
  appliesTo: "ALL",
  evaluate: (p) => {
    const verdict = compareNames(p.epfoFatherName, p.aadhaarFatherName);
    if (!nameWouldFailEpfo(verdict)) return null;
    return {
      ruleId: "KYC_RELATION_NAME_MISMATCH",
      params: { epfoFather: p.epfoFatherName, aadhaarFather: p.aadhaarFatherName },
      severity: "RISK",
      title: "Father's / husband's name differs between records",
      why: `EPFO has "${p.epfoFatherName}", Aadhaar has "${p.aadhaarFatherName}". This does not always stop a withdrawal, but it does stop pension and insurance claims, and it will be raised if the file is checked manually.`,
      actor: "MEMBER",
      repair: [
        { text: "Include this correction in the same Joint Declaration as any other name fix, so you only go through the employer once.", generates: "JOINT_DECLARATION" },
      ],
      typicalDaysToFix: 21,
    };
  },
};

const aadhaarKycRule: Rule = {
  id: "KYC_AADHAAR_NOT_VERIFIED",
  label: "Aadhaar is seeded and verified against UAN",
  appliesTo: "ALL",
  evaluate: (p) => {
    if (p.aadhaarKyc === "VERIFIED") return null;
    const state = p.aadhaarKyc === "ABSENT" ? "has never been linked" : p.aadhaarKyc === "REJECTED" ? "was linked but rejected" : "is linked but still shows Pending";
    return {
      ruleId: "KYC_AADHAAR_NOT_VERIFIED",
      i18nKey: `KYC_AADHAAR_NOT_VERIFIED:${p.aadhaarKyc}`,
      params: {},
      severity: "BLOCKER",
      title: "Aadhaar is not verified against your UAN",
      why: `Your Aadhaar ${state}. Online claims are authorised by an Aadhaar OTP, so EPFO cannot accept the claim at all until this shows Verified — not Pending.`,
      epfoRejectionText: "Claim rejected: KYC not approved / Aadhaar not verified",
      actor: p.aadhaarKyc === "PENDING" ? "EMPLOYER" : "MEMBER",
      repair: [
        { text: "Add or re-submit Aadhaar under KYC on the member portal.", where: "EPFO member portal → Manage → KYC" },
        { text: "Aadhaar KYC has to be digitally approved by your employer. Until they approve it, it stays Pending and every claim you file will be rejected.", where: "Employer's EPFO login" },
      ],
      typicalDaysToFix: 10,
    };
  },
};

const mobileRule: Rule = {
  id: "KYC_AADHAAR_MOBILE_ABSENT",
  label: "Mobile number is linked to Aadhaar",
  appliesTo: "ALL",
  evaluate: (p) => {
    if (p.mobileLinkedToAadhaar) return null;
    return {
      ruleId: "KYC_AADHAAR_MOBILE_ABSENT",
      params: {},
      severity: "BLOCKER",
      title: "No mobile number is linked to your Aadhaar",
      why: "Filing a claim needs an OTP sent to the mobile number registered in Aadhaar — not the number on your EPFO profile. If no number is registered with Aadhaar, the claim cannot be submitted at all.",
      actor: "MEMBER",
      repair: [
        { text: "Link your mobile number at any Aadhaar enrolment centre or post office. Carry your Aadhaar; the fee is ₹50.", where: "Aadhaar Seva Kendra or India Post" },
      ],
      typicalDaysToFix: 7,
    };
  },
};

const bankRule: Rule = {
  id: "KYC_BANK_NOT_VERIFIED",
  label: "Bank account is seeded and verified",
  appliesTo: ["FORM_19", "FORM_10C", "FORM_31", "FORM_10D", "FORM_5IF"],
  evaluate: (p) => {
    if (p.bank.status === "VERIFIED") return null;
    return {
      ruleId: "KYC_BANK_NOT_VERIFIED",
      params: { last4: p.bank.accountNumber.slice(-4), status: p.bank.status.toLowerCase() },
      severity: "BLOCKER",
      title: "Your bank account is not verified with EPFO",
      why: `Account ending ${p.bank.accountNumber.slice(-4)} shows as ${p.bank.status.toLowerCase()}. EPFO pays only into a bank account it has verified against your name, so the money has nowhere to go.`,
      epfoRejectionText: "Claim rejected: Bank account not seeded / KYC pending",
      actor: "EMPLOYER",
      repair: [
        { text: "Add the account number and IFSC under KYC, then upload a cheque leaf or passbook page showing your printed name.", where: "EPFO member portal → Manage → KYC" },
        { text: "Ask your employer to digitally approve it. This is the single most common stalled step.", where: "Employer's EPFO login" },
      ],
      typicalDaysToFix: 10,
    };
  },
};

const bankNameRule: Rule = {
  id: "KYC_BANK_NAME_MISMATCH",
  label: "Bank account name matches EPFO name",
  appliesTo: ["FORM_19", "FORM_10C", "FORM_31", "FORM_10D"],
  evaluate: (p) => {
    const verdict = compareNames(p.epfoName, p.bank.nameOnAccount);
    if (!nameWouldFailEpfo(verdict)) return null;
    return {
      ruleId: "KYC_BANK_NAME_MISMATCH",
      params: { bankName: p.bank.nameOnAccount, epfoName: p.epfoName },
      severity: "BLOCKER",
      title: "The name on your bank account does not match",
      why: `Your bank has you as "${p.bank.nameOnAccount}" while EPFO has "${p.epfoName}". The transfer is name-matched at the bank's end, so the payment is returned even after EPFO approves the claim — which is the worst version of this failure, because the claim shows as settled.`,
      actor: "BANK",
      repair: [
        { text: "Get the name on the bank account corrected to match Aadhaar, or add a different account whose name already matches.", where: "Your bank branch" },
      ],
      typicalDaysToFix: 14,
    };
  },
};

const ifscRule: Rule = {
  id: "KYC_IFSC_STALE",
  label: "IFSC is still valid after bank mergers",
  appliesTo: ["FORM_19", "FORM_10C", "FORM_31", "FORM_10D"],
  evaluate: (p) => {
    if (!p.bank.ifscBelongsToMergedBank) return null;
    return {
      ruleId: "KYC_IFSC_STALE",
      params: { ifsc: p.bank.ifsc },
      severity: "RISK",
      title: "Your IFSC belongs to a bank that has been merged",
      why: `IFSC ${p.bank.ifsc} is from a bank that has since merged into another. The old code stops working, and the credit fails silently after the claim is approved.`,
      actor: "MEMBER",
      repair: [
        { text: "Get the new IFSC from your bank's passbook or app, then update it under KYC and have your employer re-approve.", where: "EPFO member portal → Manage → KYC" },
      ],
      typicalDaysToFix: 10,
    };
  },
};

const panRule: Rule = {
  id: "TAX_PAN_NOT_VERIFIED",
  label: "PAN verified where TDS applies",
  appliesTo: ["FORM_19", "FORM_31"],
  simplified: true,
  evaluate: (p, c, ctx) => {
    const amount = c.requestedAmount ?? p.pfBalance;
    // Section 192A: TDS applies when service < 5 years and the amount crosses ₹50,000.
    if (ctx.serviceMonths >= 60 || amount < 50_000) return null;
    if (p.panKyc === "VERIFIED") return null;
    const rate = 0.2;
    return {
      ruleId: "TAX_PAN_NOT_VERIFIED",
      params: { tax: formatRupees(amount * rate), amount: formatRupees(amount) },
      severity: "RISK",
      title: `Without PAN you will lose about ${formatRupees(amount * rate)} to tax`,
      why: `Your service is under five years and you are withdrawing ${formatRupees(amount)}, so tax is deducted at source. With a verified PAN the rate follows your slab — often nil. Without one it is a flat 20%. The claim still goes through; you simply get less money.`,
      actor: "MEMBER",
      repair: [
        { text: "Add and verify PAN under KYC before filing. This is worth doing even if it delays you by a week.", where: "EPFO member portal → Manage → KYC" },
        { text: "If your total income for the year is below the taxable limit, submit Form 15G along with the claim instead." },
      ],
      typicalDaysToFix: 7,
      citation: "Income-tax Act, section 192A",
    };
  },
};

/* ────────────────────── employer and service history ────────────────────── */

const exitDateRule: Rule = {
  id: "SERVICE_EXIT_DATE_MISSING",
  label: "Date of exit is marked by the employer",
  appliesTo: ["FORM_19", "FORM_10C", "FORM_10D"],
  evaluate: (p, c, ctx) => {
    if (!ctx.activeSpell) return null;
    const s = ctx.activeSpell;
    // If the member is claiming final settlement, an unmarked exit is fatal.
    return {
      ruleId: "SERVICE_EXIT_DATE_MISSING",
      params: { employer: s.employerName, lastContribution: s.lastContributionMonth ?? "—" },
      severity: "BLOCKER",
      title: `${s.employerName} has not marked your date of exit`,
      why: `As far as EPFO is concerned you still work at ${s.employerName}, so a final settlement is not possible. This is the most common reason a claim is rejected, and nothing on the portal tells you it is the employer who has to act.`,
      epfoRejectionText: "Claim rejected: Date of exit not updated / Member is still in service",
      actor: "EMPLOYER",
      repair: [
        {
          text: "Send your employer a written request to mark your exit date. We have drafted it, with the exact EPFO screen they need and the rule that obliges them.",
          generates: "EMPLOYER_EXIT_REQUEST",
        },
        {
          text: `If your employer does not act within 15 days, you can mark the exit yourself — EPFO allows this once two months have passed since your last contribution (${s.lastContributionMonth ?? "unknown"}).`,
          where: "EPFO member portal → Manage → Mark Exit",
        },
        {
          text: "If the employer has shut down or refuses, raise a grievance naming the establishment code. We will draft it.",
          generates: "GRIEVANCE",
        },
      ],
      typicalDaysToFix: 15,
      citation: "EPFO facility for member-marked date of exit (2020 onward)",
    };
  },
};

const exitDateSanityRule: Rule = {
  id: "SERVICE_EXIT_BEFORE_CONTRIBUTION",
  label: "Exit date is consistent with the last contribution",
  appliesTo: "ALL",
  evaluate: (p) => {
    for (const s of p.spells) {
      if (!s.doe || !s.lastContributionMonth) continue;
      if (monthOf(s.doe) < s.lastContributionMonth) {
        return {
          ruleId: "SERVICE_EXIT_BEFORE_CONTRIBUTION",
      params: { employer: s.employerName, doe: formatIndianDate(s.doe), lastContribution: s.lastContributionMonth },
          severity: "BLOCKER",
          title: `The exit date from ${s.employerName} is wrong`,
          why: `Your exit is recorded as ${formatIndianDate(s.doe)}, but a contribution was credited for ${s.lastContributionMonth} — after you supposedly left. EPFO's system rejects this as inconsistent, and it also shortens your recorded service.`,
          epfoRejectionText: "Claim rejected: Date of exit is prior to last contribution received",
          actor: "EMPLOYER",
          repair: [
            { text: "Ask the employer to correct the exit date to the actual last working day.", generates: "EMPLOYER_EXIT_REQUEST" },
          ],
          typicalDaysToFix: 20,
        };
      }
    }
    return null;
  },
};

const unmergedUanRule: Rule = {
  id: "SERVICE_UNMERGED_UAN",
  label: "All UANs merged into one",
  appliesTo: "ALL",
  evaluate: (p) => {
    if (p.unmergedUans.length === 0) return null;
    return {
      ruleId: "SERVICE_UNMERGED_UAN",
      params: { count: p.unmergedUans.length + 1, uans: p.unmergedUans.join(", ") },
      severity: "RISK",
      title: `You have ${p.unmergedUans.length + 1} PF numbers, not one`,
      why: `Another UAN exists in your name (${p.unmergedUans.join(", ")}). Each one holds part of your money and part of your service. Claiming from one leaves the rest stranded, and because pension needs ten years of *continuous recorded* service, split UANs can make you look ineligible when you are not.`,
      actor: "MEMBER",
      repair: [
        { text: "Merge the old UANs into the one you use now. We have prepared the request.", generates: "UAN_MERGE_REQUEST" },
        { text: "Merging takes longer than a withdrawal. If you need money urgently, claim from the current UAN first and merge afterwards — but only if you are not close to ten years of service." },
      ],
      typicalDaysToFix: 30,
    };
  },
};

const transferRule: Rule = {
  id: "SERVICE_NOT_TRANSFERRED",
  label: "Past service transferred into current UAN",
  appliesTo: ["FORM_19", "FORM_10C", "FORM_10D"],
  evaluate: (p, c, ctx) => {
    const untransferred = p.spells.filter((s) => !s.transferredIntoCurrentUan);
    if (untransferred.length === 0) return null;
    const lostMonths = ctx.serviceMonths - ctx.mergedServiceMonths;
    return {
      ruleId: "SERVICE_NOT_TRANSFERRED",
      params: { years: Math.floor(lostMonths / 12), months: lostMonths % 12, employers: untransferred.map((x) => x.employerName).join(", ") },
      severity: "RISK",
      title: `${Math.floor(lostMonths / 12)} years ${lostMonths % 12} months of your service is not counted yet`,
      why: `Service with ${untransferred.map((s) => s.employerName).join(", ")} has not been transferred into your current PF account. EPFO will settle only what it can see, so your service looks shorter than it is — which affects tax, pension eligibility and how much you can withdraw.`,
      actor: "MEMBER",
      repair: [
        { text: "File a transfer request (Form 13) online for each past employer before claiming.", where: "EPFO member portal → Online Services → One Member One EPF Account" },
      ],
      typicalDaysToFix: 25,
    };
  },
};

const contributionGapRule: Rule = {
  id: "SERVICE_CONTRIBUTION_GAP",
  label: "No missing employer contributions",
  appliesTo: "ALL",
  evaluate: (p) => {
    const gaps = p.spells.flatMap((s) => s.contributionGapMonths.map((m) => ({ employer: s.employerName, month: m })));
    if (gaps.length === 0) return null;
    return {
      ruleId: "SERVICE_CONTRIBUTION_GAP",
      params: { count: gaps.length, months: gaps.map((g) => g.month).join(", ") },
      severity: "RISK",
      title: `${gaps.length} month${gaps.length > 1 ? "s" : ""} of contributions are missing`,
      why: `Your employer deducted PF from your salary but no deposit reached EPFO for ${gaps.map((g) => g.month).join(", ")}. Those months do not count towards your service and the money is not in your balance. Claiming now settles the smaller amount and closes the account.`,
      actor: "EMPLOYER",
      repair: [
        { text: "Get the missing months deposited before you claim, using your payslips for those months as proof of deduction.", generates: "GRIEVANCE" },
        { text: "Non-deposit of a deduction is an offence, not an administrative lapse. Say so in the grievance — it changes how it is handled." },
      ],
      typicalDaysToFix: 45,
      citation: "EPF & MP Act 1952, section 14 and section 406/409 IPC read with EPFO enforcement circulars",
    };
  },
};

const dscRule: Rule = {
  id: "EMPLOYER_DSC_INACTIVE",
  label: "Employer's digital signature is active",
  appliesTo: "ALL",
  evaluate: (p) => {
    if (p.employerDscActive) return null;
    return {
      ruleId: "EMPLOYER_DSC_INACTIVE",
      params: {},
      severity: "RISK",
      title: "Your employer's digital signature has expired",
      why: "Anything that needs employer approval — KYC, exit date, a Joint Declaration — is stuck until their digital signature is re-registered with EPFO. Requests you send will simply sit there with no error shown to you.",
      actor: "EMPLOYER",
      repair: [
        { text: "Flag this to the employer's HR or PF consultant directly; the member portal gives them no alert." },
        { text: "If the establishment is defunct, ask the regional office to approve on the employer's behalf.", generates: "GRIEVANCE" },
      ],
      typicalDaysToFix: 20,
    };
  },
};

/* ──────────────────────── form-specific eligibility ──────────────────────── */

const stillEmployedRule: Rule = {
  id: "ELIG_STILL_EMPLOYED",
  label: "Not in continuing service (final settlement only)",
  appliesTo: ["FORM_19", "FORM_10C"],
  evaluate: (p, c, ctx) => {
    if (!ctx.activeSpell) return null;
    if (p.unemployedSince) return null;
    return {
      ruleId: "ELIG_STILL_EMPLOYED",
      params: { employer: ctx.activeSpell.employerName },
      severity: "BLOCKER",
      title: "You cannot fully withdraw while still employed",
      why: `You are shown as working at ${ctx.activeSpell.employerName}. A final settlement is only for people who have left work. What you can do while employed is take a partial advance, which does not close your account or your pension service.`,
      actor: "MEMBER",
      repair: [
        { text: "Switch to a partial advance (Form 31) instead. Tell us why you need the money and we will check which purpose you qualify under." },
      ],
      typicalDaysToFix: 0,
      citation: "EPF Scheme 1952, paragraph 69",
    };
  },
};

const twoMonthWaitRule: Rule = {
  id: "ELIG_TWO_MONTH_WAIT",
  label: "Two months since leaving employment",
  appliesTo: ["FORM_19"],
  evaluate: (p, c) => {
    if (!p.unemployedSince) return null;
    const months = monthsBetween(p.unemployedSince, c.asOf);
    if (months >= 2) return null;
    const eligibleFrom = new Date(`${p.unemployedSince}T00:00:00Z`);
    eligibleFrom.setUTCMonth(eligibleFrom.getUTCMonth() + 2);
    const iso = eligibleFrom.toISOString().slice(0, 10);
    return {
      ruleId: "ELIG_TWO_MONTH_WAIT",
      params: { eligibleFrom: formatIndianDate(iso), leftOn: formatIndianDate(p.unemployedSince) },
      severity: "BLOCKER",
      title: `Too early — you can file this from ${formatIndianDate(iso)}`,
      why: `Full withdrawal needs two months to have passed since you stopped working. You left on ${formatIndianDate(p.unemployedSince)}. Filing before ${formatIndianDate(iso)} gets rejected, and a rejection puts you at the back of the queue.`,
      epfoRejectionText: "Claim rejected: Claim submitted before completion of two months from date of leaving",
      actor: "MEMBER",
      repair: [
        { text: `Wait until ${formatIndianDate(iso)} and file then. Use the time to clear the other items on this list.` },
        { text: "If you need money before that, you can take an unemployment advance of 75% of your balance after just one month, without closing the account." },
      ],
      typicalDaysToFix: 0,
      citation: "EPF Scheme 1952, paragraph 69(2)",
    };
  },
};

const schemeCertRule: Rule = {
  id: "ELIG_10C_SERVICE_TOO_LONG",
  label: "Under ten years of service (withdrawal benefit)",
  appliesTo: ["FORM_10C"],
  evaluate: (p, c, ctx) => {
    if (ctx.serviceMonths < 120) return null;
    return {
      ruleId: "ELIG_10C_SERVICE_TOO_LONG",
      params: { years: Math.floor(ctx.serviceMonths / 12) },
      severity: "BLOCKER",
      title: "You have crossed ten years — this is pension, not a withdrawal",
      why: `Your recorded service is ${Math.floor(ctx.serviceMonths / 12)} years. Past ten years the pension contribution cannot be withdrawn as cash; it becomes a lifelong monthly pension from age 58. Applying to withdraw it will be rejected. This is worth understanding rather than fighting — the pension is usually worth far more.`,
      actor: "MEMBER",
      repair: [
        { text: "Apply for a Scheme Certificate instead, which preserves your service if you change jobs." },
        { text: "You can still withdraw the PF part in full using Form 19. Only the pension part is locked." },
      ],
      typicalDaysToFix: 0,
      citation: "EPS 1995, paragraph 14",
    };
  },
};

const notEpsRule: Rule = {
  id: "ELIG_NOT_EPS_MEMBER",
  label: "Enrolled in the pension scheme",
  appliesTo: ["FORM_10C", "FORM_10D"],
  evaluate: (p) => {
    if (p.spells.some((s) => s.epsMember)) return null;
    return {
      ruleId: "ELIG_NOT_EPS_MEMBER",
      params: { firstEmployer: p.spells[0]?.employerName ?? "your first employer" },
      severity: "BLOCKER",
      title: "You are not a member of the pension scheme",
      why: `None of your employers enrolled you in EPS. If your starting wage was above ₹15,000 and you joined after September 2014, this is correct and there is no pension to claim. If you were earning less than that, you should have been enrolled — and that is worth challenging.`,
      actor: "MEMBER",
      repair: [
        { text: `Check your first payslip. If your basic wage was under ₹15,000 when you joined ${p.spells[0]?.employerName ?? "your first employer"}, raise a grievance for wrongful non-enrolment.`, generates: "GRIEVANCE" },
        { text: "Otherwise withdraw only the PF amount using Form 19." },
      ],
      typicalDaysToFix: 0,
      citation: "EPS 1995, paragraph 6 read with the wage ceiling notification of 1 September 2014",
    };
  },
};

const pensionServiceRule: Rule = {
  id: "ELIG_10D_SERVICE_SHORT",
  label: "Ten years of service for pension",
  appliesTo: ["FORM_10D"],
  evaluate: (p, c, ctx) => {
    if (ctx.serviceMonths >= 120) return null;
    const short = 120 - ctx.serviceMonths;
    return {
      ruleId: "ELIG_10D_SERVICE_SHORT",
      params: { shortYears: Math.floor(short / 12), shortMonths: short % 12, years: Math.floor(ctx.serviceMonths / 12), months: ctx.serviceMonths % 12 },
      severity: "BLOCKER",
      title: `Pension needs ten years — you are ${Math.floor(short / 12)}y ${short % 12}m short`,
      why: `EPFO counts ${Math.floor(ctx.serviceMonths / 12)} years ${ctx.serviceMonths % 12} months for you. Monthly pension starts only at ten years. Below that you take the pension contribution as a one-time withdrawal instead.`,
      actor: "MEMBER",
      repair: [
        { text: "Before accepting this, check whether service under an old UAN or an untransferred employer is missing. That is often what puts people under ten years on paper." },
        { text: "If ten years is genuinely not reached, claim the withdrawal benefit using Form 10C." },
      ],
      typicalDaysToFix: 0,
      citation: "EPS 1995, paragraph 12",
    };
  },
};

const pensionAgeRule: Rule = {
  id: "ELIG_10D_AGE",
  label: "Age fifty or above for pension",
  appliesTo: ["FORM_10D"],
  evaluate: (p, c, ctx) => {
    if (ctx.ageYears >= 50) return null;
    return {
      ruleId: "ELIG_10D_AGE",
      params: { age: ctx.ageYears },
      severity: "BLOCKER",
      title: `Pension cannot start before fifty — you are ${ctx.ageYears}`,
      why: "Full pension begins at 58. It can start early from 50, at a reduced rate of about 4% less for each year before 58. Before 50 there is no pension option at all.",
      actor: "MEMBER",
      repair: [
        { text: "Apply for a Scheme Certificate now to protect the service you have earned, and claim the pension when you turn 58." },
      ],
      typicalDaysToFix: 0,
      citation: "EPS 1995, paragraph 12(7)",
    };
  },
};

/** Minimum service and ceiling for each Form 31 purpose. Simplified. */
const ADVANCE_TERMS: Record<AdvancePurpose, {
  minServiceMonths: number;
  ceiling: (ctx: DerivedContext) => number;
  ceilingLabel: string;
  ceilingLabelHi: string;
  label: string;
  labelHi: string;
}> = {
  ILLNESS: { minServiceMonths: 0, ceiling: (c) => Math.min(c.monthlyWage * 6, c.memberShare), ceilingLabel: "six months' wages, or your own share, whichever is less", label: "medical treatment", labelHi: "इलाज", ceilingLabelHi: "छह महीने की तनख़्वाह, या आपका हिस्सा — जो कम हो" },
  EDUCATION: { minServiceMonths: 84, ceiling: (c) => c.memberShare * 0.5, ceilingLabel: "half of your own share", label: "education", labelHi: "पढ़ाई", ceilingLabelHi: "आपके हिस्से का आधा" },
  MARRIAGE: { minServiceMonths: 84, ceiling: (c) => c.memberShare * 0.5, ceilingLabel: "half of your own share", label: "marriage", labelHi: "शादी", ceilingLabelHi: "आपके हिस्से का आधा" },
  HOUSE_PURCHASE: { minServiceMonths: 60, ceiling: (c) => Math.min(c.monthlyWage * 24, c.memberShare), ceilingLabel: "twenty-four months' wages, or your own share, whichever is less", label: "buying or building a house", labelHi: "घर ख़रीदने या बनाने", ceilingLabelHi: "चौबीस महीने की तनख़्वाह, या आपका हिस्सा — जो कम हो" },
  HOUSE_REPAIR: { minServiceMonths: 60, ceiling: (c) => Math.min(c.monthlyWage * 12, c.memberShare), ceilingLabel: "twelve months' wages", label: "house repair", labelHi: "घर की मरम्मत", ceilingLabelHi: "बारह महीने की तनख़्वाह" },
  HOUSING_LOAN_REPAY: { minServiceMonths: 120, ceiling: (c) => Math.min(c.monthlyWage * 36, c.memberShare), ceilingLabel: "thirty-six months' wages", label: "repaying a housing loan", labelHi: "होम लोन चुकाने", ceilingLabelHi: "छत्तीस महीने की तनख़्वाह" },
  UNEMPLOYMENT: { minServiceMonths: 0, ceiling: (c) => c.memberShare * 0.75, ceilingLabel: "75% of your own share", label: "being out of work", labelHi: "काम न होने", ceilingLabelHi: "आपके हिस्से का 75%" },
  NATURAL_CALAMITY: { minServiceMonths: 0, ceiling: (c) => Math.min(5000, c.memberShare * 0.5), ceilingLabel: "₹5,000 or half your share", label: "a natural calamity", labelHi: "प्राकृतिक आपदा", ceilingLabelHi: "₹5,000 या आपके हिस्से का आधा" },
};

const advanceServiceRule: Rule = {
  id: "ELIG_31_SERVICE",
  label: "Enough service for this advance purpose",
  appliesTo: ["FORM_31"],
  simplified: true,
  evaluate: (p, c, ctx) => {
    if (!c.purpose) return null;
    const terms = ADVANCE_TERMS[c.purpose];
    if (ctx.serviceMonths >= terms.minServiceMonths) return null;
    const short = terms.minServiceMonths - ctx.serviceMonths;
    return {
      ruleId: "ELIG_31_SERVICE",
      params: { label: terms.labelHi, minYears: terms.minServiceMonths / 12, years: Math.floor(ctx.serviceMonths / 12), months: ctx.serviceMonths % 12, shortYears: Math.floor(short / 12), shortMonths: short % 12 },
      severity: "BLOCKER",
      title: `An advance for ${terms.label} needs ${terms.minServiceMonths / 12} years of service`,
      why: `You have ${Math.floor(ctx.serviceMonths / 12)} years ${ctx.serviceMonths % 12} months, so you are ${Math.floor(short / 12)} years ${short % 12} months short for this purpose. Each purpose has its own minimum, and EPFO checks the purpose you tick.`,
      epfoRejectionText: "Claim rejected: Member not eligible for the advance under the para claimed",
      actor: "MEMBER",
      repair: [
        { text: "Check whether a different purpose fits your actual need — medical treatment and unemployment have no minimum service at all." },
        { text: "If service under an old employer has not been transferred, transferring it may take you over the threshold." },
      ],
      typicalDaysToFix: 0,
      citation: "EPF Scheme 1952, paragraphs 68B, 68J, 68K",
    };
  },
};

const advanceCeilingRule: Rule = {
  id: "ELIG_31_CEILING",
  label: "Requested amount within the purpose ceiling",
  appliesTo: ["FORM_31"],
  simplified: true,
  evaluate: (p, c, ctx) => {
    if (!c.purpose || !c.requestedAmount) return null;
    const terms = ADVANCE_TERMS[c.purpose];
    const max = Math.floor(terms.ceiling(ctx));
    if (c.requestedAmount <= max) return null;
    return {
      ruleId: "ELIG_31_CEILING",
      params: { requested: formatRupees(c.requestedAmount), max: formatRupees(max), label: terms.labelHi, ceilingLabel: terms.ceilingLabelHi },
      severity: "BLOCKER",
      title: `You asked for ${formatRupees(c.requestedAmount)} but can get ${formatRupees(max)}`,
      why: `For ${terms.label} the limit is ${terms.ceilingLabel} — ${formatRupees(max)} in your case. EPFO rejects the whole claim rather than paying the lower amount, so the number you enter has to be right.`,
      epfoRejectionText: "Claim rejected: Amount claimed exceeds eligible amount",
      actor: "MEMBER",
      repair: [
        { text: `File for ${formatRupees(max)} or less.` },
      ],
      typicalDaysToFix: 0,
      citation: "EPF Scheme 1952, paragraph 68 series",
    };
  },
};

const duplicateClaimRule: Rule = {
  id: "PROCESS_DUPLICATE_CLAIM",
  label: "No identical claim already in progress",
  appliesTo: "ALL",
  evaluate: (p, c) => {
    if (!p.claimsInProgress.includes(c.type)) return null;
    return {
      ruleId: "PROCESS_DUPLICATE_CLAIM",
      params: {},
      severity: "BLOCKER",
      title: "You already have this claim in progress",
      why: "A claim of this type is already with EPFO. Filing again does not speed it up — the second one is rejected as a duplicate, and in some offices both get returned.",
      actor: "MEMBER",
      repair: [
        { text: "Track the existing claim instead. If it has been more than twenty days, that is past EPFO's own deadline and you have grounds to escalate.", generates: "GRIEVANCE" },
      ],
      typicalDaysToFix: 0,
      citation: "EPFO Citizen's Charter — twenty-day settlement commitment",
    };
  },
};

const nominationRule: Rule = {
  id: "PROCESS_NOMINATION_MISSING",
  label: "e-Nomination filed",
  appliesTo: "ALL",
  evaluate: (p, c) => {
    if (p.eNominationFiled) return null;
    const blocking = c.type === "FORM_5IF" || c.type === "FORM_10D";
    return {
      ruleId: "PROCESS_NOMINATION_MISSING",
      i18nKey: blocking ? "PROCESS_NOMINATION_MISSING:blocking" : "PROCESS_NOMINATION_MISSING:advisory",
      params: {},
      severity: blocking ? "BLOCKER" : "ADVISORY",
      title: blocking ? "No nominee is registered" : "You have not filed a nominee",
      why: blocking
        ? "Insurance and family pension are paid to a registered nominee. With none on record, the family has to prove heirship through a succession certificate — months of court process for money that should take weeks."
        : "This does not affect the claim you are filing. But if anything happens to you, your family will need a court certificate to get this money instead of a two-week claim. It takes ten minutes to fix.",
      actor: "MEMBER",
      repair: [
        { text: "File e-Nomination on the member portal. It needs an Aadhaar OTP and no employer approval.", where: "EPFO member portal → Manage → e-Nomination" },
      ],
      typicalDaysToFix: 1,
    };
  },
};

const epsWageRule: Rule = {
  id: "DATA_EPS_WAGE_INCONSISTENT",
  label: "EPS enrolment consistent with wage",
  appliesTo: ["FORM_10C", "FORM_10D"],
  evaluate: (p) => {
    const bad = p.spells.find((s) => s.epsMember && s.monthlyWage > 15_000 && s.doj >= "2014-09-01");
    if (!bad) return null;
    return {
      ruleId: "DATA_EPS_WAGE_INCONSISTENT",
      params: { employer: bad.employerName, wage: formatRupees(bad.monthlyWage) },
      severity: "RISK",
      title: "Your pension record contradicts your wage record",
      why: `You are marked as a pension-scheme member at ${bad.employerName} on a wage of ${formatRupees(bad.monthlyWage)}, having joined after September 2014 — above the ₹15,000 ceiling, where enrolment should not have happened. EPFO's validation flags this and stops the claim with an error most members cannot interpret.`,
      epfoRejectionText: "Claim rejected: Wages more than 15000 / EPS membership not applicable",
      actor: "EPFO",
      repair: [
        { text: "This is a record error, not something you did. Raise a grievance asking the regional office to reconcile the EPS flag against the wage in the ECR.", generates: "GRIEVANCE" },
        { text: "Attach the payslip for your joining month. Without it the office will close the grievance without acting." },
      ],
      typicalDaysToFix: 30,
    };
  },
};

export const RULES: Rule[] = [
  nameRule, dobRule, fatherNameRule, aadhaarKycRule, mobileRule,
  bankRule, bankNameRule, ifscRule, panRule,
  exitDateRule, exitDateSanityRule, unmergedUanRule, transferRule,
  contributionGapRule, dscRule,
  stillEmployedRule, twoMonthWaitRule, schemeCertRule, notEpsRule,
  pensionServiceRule, pensionAgeRule,
  advanceServiceRule, advanceCeilingRule,
  duplicateClaimRule, nominationRule, epsWageRule,
];

export { ADVANCE_TERMS };
