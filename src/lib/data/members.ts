import type { MemberProfile } from "@/lib/engine/types";
import { buildPassbook, summarise } from "@/lib/passbook";

/**
 * Mock EPFO member records.
 *
 * Every field here corresponds to something EPFO genuinely holds about a member.
 * The values are synthetic: the UANs are outside the real allocation range, the
 * names are invented, the Aadhaar numbers are absent entirely, and no record is
 * derived from any real person or any live EPFO system. Each persona is built to
 * exercise a different failure path in the rule catalogue.
 */

const RAW: Record<string, MemberProfile> = {
  /* The most common case in India: money is ready, three records disagree. */
  "900000000001": {
    uan: "900000000001",
    epfoName: "RAMESH K YADAV",
    aadhaarName: "RAMESH KUMAR YADAV",
    epfoDob: "1991-06-14",
    aadhaarDob: "1991-06-14",
    epfoFatherName: "SHIV YADAV",
    aadhaarFatherName: "SHIV NARAYAN YADAV",
    epfoGender: "M",
    aadhaarGender: "M",
    aadhaarKyc: "VERIFIED",
    panKyc: "ABSENT",
    bank: {
      status: "PENDING",
      accountNumber: "30124567890",
      ifsc: "SBIN0011234",
      nameOnAccount: "RAMESH KUMAR YADAV",
      ifscBelongsToMergedBank: false,
    },
    mobileLinkedToAadhaar: true,
    spells: [
      {
        employerName: "Sunrise Auto Components Pvt Ltd",
        establishmentId: "MHBAN0045678000",
        doj: "2022-02-01",
        doe: null,
        epsMember: true,
        monthlyWage: 14_200,
        contributionGapMonths: [],
        lastContributionMonth: "2026-05",
        transferredIntoCurrentUan: true,
      },
    ],
    unmergedUans: [],
    eNominationFiled: false,
    employerDscActive: true,
    claimsInProgress: [],
    unemployedSince: "2026-05-28",
    pfBalance: 187_450,
  },

  /* Split service: two UANs, so ten years of work looks like four. */
  "900000000002": {
    uan: "900000000002",
    epfoName: "SUNITA DEVI",
    aadhaarName: "SUNITA DEVI",
    epfoDob: "1984-11-02",
    aadhaarDob: "1984-11-02",
    epfoFatherName: "RAM PRASAD",
    aadhaarFatherName: "RAM PRASAD",
    epfoGender: "F",
    aadhaarGender: "F",
    aadhaarKyc: "VERIFIED",
    panKyc: "ABSENT",
    bank: {
      status: "VERIFIED",
      accountNumber: "40098877123",
      ifsc: "CORP0001234",
      nameOnAccount: "SUNITA DEVI",
      ifscBelongsToMergedBank: true,
    },
    mobileLinkedToAadhaar: true,
    spells: [
      {
        employerName: "Anand Garments Export House",
        establishmentId: "KNBNG0033221000",
        doj: "2016-07-11",
        doe: "2021-03-31",
        epsMember: true,
        monthlyWage: 11_800,
        contributionGapMonths: [],
        lastContributionMonth: "2021-03",
        transferredIntoCurrentUan: false,
      },
      {
        employerName: "Vaishnavi Apparel Works",
        establishmentId: "KNBNG0077665000",
        doj: "2021-06-01",
        doe: "2026-06-30",
        epsMember: true,
        monthlyWage: 15_600,
        contributionGapMonths: [],
        lastContributionMonth: "2026-06",
        transferredIntoCurrentUan: true,
      },
    ],
    unmergedUans: ["900000000902"],
    eNominationFiled: true,
    employerDscActive: true,
    claimsInProgress: [],
    unemployedSince: "2026-06-30",
    pfBalance: 412_900,
  },

  /* Crossed ten years and is trying to cash out a pension. Needs redirecting. */
  "900000000003": {
    uan: "900000000003",
    epfoName: "MOHAMMED IRFAN",
    aadhaarName: "MOHAMMED IRFAN",
    epfoDob: "1979-03-19",
    aadhaarDob: "1979-03-19",
    epfoFatherName: "ABDUL RAHMAN",
    aadhaarFatherName: "ABDUL RAHMAN",
    epfoGender: "M",
    aadhaarGender: "M",
    aadhaarKyc: "VERIFIED",
    panKyc: "VERIFIED",
    bank: {
      status: "VERIFIED",
      accountNumber: "50011223344",
      ifsc: "HDFC0000123",
      nameOnAccount: "MOHAMMED IRFAN",
      ifscBelongsToMergedBank: false,
    },
    mobileLinkedToAadhaar: true,
    spells: [
      {
        employerName: "Deccan Logistics Ltd",
        establishmentId: "TGHYD0012345000",
        doj: "2011-08-16",
        doe: "2026-07-31",
        epsMember: true,
        monthlyWage: 24_500,
        contributionGapMonths: [],
        lastContributionMonth: "2026-07",
        transferredIntoCurrentUan: true,
      },
    ],
    unmergedUans: [],
    eNominationFiled: true,
    employerDscActive: true,
    claimsInProgress: [],
    unemployedSince: "2026-07-31",
    pfBalance: 1_140_000,
  },

  /* The employer took the deduction and never deposited it. */
  "900000000004": {
    uan: "900000000004",
    epfoName: "GANESH PATIL",
    aadhaarName: "GANESH PATIL",
    epfoDob: "1995-01-25",
    aadhaarDob: "1995-01-25",
    epfoFatherName: "DATTATRAY PATIL",
    aadhaarFatherName: "DATTATRAY PATIL",
    epfoGender: "M",
    aadhaarGender: "M",
    aadhaarKyc: "PENDING",
    panKyc: "VERIFIED",
    bank: {
      status: "VERIFIED",
      accountNumber: "60077665544",
      ifsc: "BKID0001111",
      nameOnAccount: "GANESH PATIL",
      ifscBelongsToMergedBank: false,
    },
    mobileLinkedToAadhaar: true,
    spells: [
      {
        employerName: "Shree Balaji Facility Services",
        establishmentId: "MHPUN0088990000",
        doj: "2023-04-03",
        doe: "2026-06-15",
        epsMember: true,
        monthlyWage: 16_900,
        contributionGapMonths: ["2025-11", "2025-12", "2026-01"],
        lastContributionMonth: "2026-06",
        transferredIntoCurrentUan: true,
      },
    ],
    unmergedUans: [],
    eNominationFiled: false,
    employerDscActive: false,
    claimsInProgress: [],
    unemployedSince: "2026-06-15",
    pfBalance: 96_300,
  },

  /* A clean record, so the happy path is demonstrable too. */
  "900000000005": {
    uan: "900000000005",
    epfoName: "LAKSHMI NARAYANAN",
    aadhaarName: "LAKSHMI NARAYANAN",
    epfoDob: "1990-09-08",
    aadhaarDob: "1990-09-08",
    epfoFatherName: "NARAYANAN S",
    aadhaarFatherName: "NARAYANAN S",
    epfoGender: "F",
    aadhaarGender: "F",
    aadhaarKyc: "VERIFIED",
    panKyc: "VERIFIED",
    bank: {
      status: "VERIFIED",
      accountNumber: "70033221100",
      ifsc: "ICIC0000456",
      nameOnAccount: "LAKSHMI NARAYANAN",
      ifscBelongsToMergedBank: false,
    },
    mobileLinkedToAadhaar: true,
    spells: [
      {
        employerName: "Kaveri Textiles Ltd",
        establishmentId: "TNCHN0055443000",
        doj: "2017-05-02",
        doe: null,
        epsMember: true,
        monthlyWage: 21_400,
        contributionGapMonths: [],
        lastContributionMonth: "2026-07",
        transferredIntoCurrentUan: true,
      },
    ],
    unmergedUans: [],
    eNominationFiled: true,
    employerDscActive: true,
    claimsInProgress: [],
    unemployedSince: null,
    pfBalance: 528_700,
  },
};

/**
 * The balance is derived from the passbook rather than stated.
 *
 * Every rupee shown anywhere in this prototype therefore traces back to a
 * specific month's contribution at a specific employer, and a month that was
 * deducted but never remitted reduces the balance exactly as it does in life.
 * A hand-written balance that did not reconcile with the passbook would be the
 * kind of quiet inconsistency this whole project is a complaint about.
 */
export const MEMBERS: Record<string, MemberProfile> = Object.fromEntries(
  Object.entries(RAW).map(([uan, m]) => {
    const asOf = new Date().toISOString().slice(0, 10);
    const summary = summarise(buildPassbook(m, asOf));
    return [uan, { ...m, pfBalance: summary.epfBalance }];
  }),
);

export const MEMBER_LIST = Object.values(MEMBERS);
