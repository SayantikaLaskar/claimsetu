import type { ClaimType } from "@/lib/engine/types";

/**
 * Claim tracking.
 *
 * The EPFO portal reports a claim's state as a status line like "Claim form 19
 * has been approved. Payment is under process." What it never tells a member is
 * which desk the file is sitting on, how long that desk usually takes, whether
 * the twenty-day commitment has already been breached, or what to do about it.
 *
 * The last of those is the important one. EPFO's own Citizen's Charter commits
 * to settling a complete claim in twenty days, and a Regional Provident Fund
 * Commissioner can be held liable for penal interest on a delay beyond it. Most
 * members have never heard of either. A tracker that counts to twenty and then
 * hands over a drafted escalation is doing something the portal structurally
 * will not.
 */

export interface Stage {
  id: string;
  /** What EPFO's own status line calls this. */
  epfoLabel: string;
  epfoLabelHi: string;
  /** What is actually happening, and who is holding the file. */
  plain: string;
  plainHi: string;
  desk: string;
  deskHi: string;
  /** Typical working days spent at this desk. */
  typicalDays: number;
}

export const STAGES: Stage[] = [
  {
    id: "SUBMITTED",
    epfoLabel: "Claim form submitted",
    epfoLabelHi: "क्लेम फ़ॉर्म जमा हुआ",
    plain: "Your claim has reached the regional office and been given a number. Nobody has looked at it yet.",
    plainHi:
      "आपका क्लेम क्षेत्रीय कार्यालय पहुँच गया है और उसे नंबर मिल गया है। अभी किसी ने देखा नहीं है।",
    desk: "Automated intake",
    deskHi: "स्वचालित प्रवेश",
    typicalDays: 1,
  },
  {
    id: "UNDER_PROCESS",
    epfoLabel: "Claim form is under process",
    epfoLabelHi: "क्लेम फ़ॉर्म प्रक्रिया में है",
    plain: "A dealing assistant is checking your KYC, your service history and the amount against the scheme rules. This is the step where claims get rejected.",
    plainHi:
      "एक डीलिंग असिस्टेंट आपकी केवाईसी, नौकरी का ब्यौरा और रकम को नियमों से मिला रहा है। क्लेम इसी क़दम पर रिजेक्ट होते हैं।",
    desk: "Dealing Assistant, regional office",
    deskHi: "डीलिंग असिस्टेंट, क्षेत्रीय कार्यालय",
    typicalDays: 7,
  },
  {
    id: "SUPERVISOR",
    epfoLabel: "Claim form is under process",
    epfoLabelHi: "क्लेम फ़ॉर्म प्रक्रिया में है",
    plain: "The file has cleared the first check and is with a supervisor for a second look. Same status line as before, which is why the portal feels stuck here.",
    plainHi:
      "फ़ाइल पहली जाँच पार कर चुकी है और दूसरी नज़र के लिए सुपरवाइज़र के पास है। स्टेटस वही पुराना दिखता है, इसीलिए पोर्टल यहाँ अटका हुआ लगता है।",
    desk: "Section Supervisor",
    deskHi: "सेक्शन सुपरवाइज़र",
    typicalDays: 4,
  },
  {
    id: "APPROVED",
    epfoLabel: "Claim form has been approved",
    epfoLabelHi: "क्लेम फ़ॉर्म मंज़ूर हुआ",
    plain: "An officer has approved the payment. The money has not moved yet.",
    plainHi:
      "अधिकारी ने भुगतान मंज़ूर कर दिया है। पैसा अभी चला नहीं है।",
    desk: "Assistant / Regional Provident Fund Commissioner",
    deskHi: "सहायक / क्षेत्रीय भविष्य निधि आयुक्त",
    typicalDays: 3,
  },
  {
    id: "PAYMENT",
    epfoLabel: "Payment is under process",
    epfoLabelHi: "भुगतान प्रक्रिया में है",
    plain: "The amount has been released to your bank. If your bank details are wrong, this is where it silently fails and comes back.",
    plainHi:
      "रकम आपके बैंक को भेज दी गई है। बैंक की जानकारी ग़लत हो तो यहीं चुपचाप फ़ेल होकर वापस आ जाती है।",
    desk: "Accounts, then your bank",
    deskHi: "लेखा विभाग, फिर आपका बैंक",
    typicalDays: 3,
  },
  {
    id: "SETTLED",
    epfoLabel: "Claim settled",
    epfoLabelHi: "क्लेम सेटल हुआ",
    plain: "The money is in your account.",
    plainHi:
      "पैसा आपके खाते में है।",
    desk: "—",
    deskHi: "—",
    typicalDays: 0,
  },
];

/** EPFO's own commitment, and the lever it gives a member. */
export const SLA_DAYS = 20;

export interface TrackedClaim {
  reference: string;
  claimType: ClaimType;
  /** Working days since the claim was filed. */
  daysElapsed: number;
  stageIndex: number;
  amount: number;
}

/**
 * Where a claim of a given age would be.
 *
 * Deterministic on purpose: the same reference and day count always produce the
 * same state, so the demo is reproducible and the numbers can be checked.
 */
export function stageForDay(daysElapsed: number): number {
  let acc = 0;
  for (let i = 0; i < STAGES.length; i++) {
    acc += STAGES[i].typicalDays;
    if (daysElapsed < acc) return i;
  }
  return STAGES.length - 1;
}

/** Reference number in EPFO's own format, so it looks like what members see. */
export function makeReference(uan: string, claimType: ClaimType): string {
  const region = "PUPUN";
  const suffix = uan.slice(-7);
  const form = claimType.replace("FORM_", "");
  return `${region}${new Date().getFullYear()}${form}${suffix}`;
}

/**
 * Where a claim actually is, distinguishing progress from a stall.
 *
 * A claim that reaches the payment desk completes within a day or two, so a
 * claim still open past the twenty-day commitment is not "nearly done" — it is
 * sitting at the first checking desk, which is where files stall in practice.
 * Advancing the tracker purely on elapsed time would have shown a stuck member
 * a settled claim, which is the same lie the portal already tells.
 */
export function claimState(daysElapsed: number): { stageIndex: number; stalled: boolean } {
  if (daysElapsed > SLA_DAYS) {
    return { stageIndex: STAGES.findIndex((s) => s.id === "UNDER_PROCESS"), stalled: true };
  }
  return { stageIndex: stageForDay(daysElapsed), stalled: false };
}

export interface SlaStatus {
  breached: boolean;
  daysRemaining: number;
  daysOver: number;
}

export function slaStatus(daysElapsed: number): SlaStatus {
  return {
    breached: daysElapsed > SLA_DAYS,
    daysRemaining: Math.max(0, SLA_DAYS - daysElapsed),
    daysOver: Math.max(0, daysElapsed - SLA_DAYS),
  };
}
