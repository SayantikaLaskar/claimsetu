import type { AdvancePurpose, ClaimType } from "@/lib/engine/types";

/**
 * Plain-language needs, mapped to EPFO forms.
 *
 * The EPFO portal asks members to choose between "Form 19", "Form 10C",
 * "Form 31" and "Form 10D" with no explanation of what they mean. Choosing
 * wrong is itself one of the top rejection causes — and the member never learns
 * that the *form* was the mistake, only that the claim failed.
 *
 * So the member states a situation, and the form is derived. The EPFO name is
 * still shown, quietly, because they will see it on the portal and on any
 * rejection letter and need to recognise it.
 */

export interface Need {
  id: string;
  /** How a member would actually describe this, unprompted. */
  label: string;
  labelHi: string;
  /** The situation, so they can tell two similar options apart. */
  detail: string;
  detailHi: string;
  claimType: ClaimType;
  formName: string;
  needsAmount: boolean;
  needsPurpose: boolean;
}

export const NEEDS: Need[] = [
  {
    id: "left-job",
    label: "I have left my job and want all my PF money",
    labelHi: "मैंने नौकरी छोड़ दी है और पूरा पीएफ़ चाहिए",
    detail: "Closes the account and pays out the whole balance. Only after two months without work.",
    detailHi: "खाता बंद हो जाता है और पूरा पैसा मिल जाता है। नौकरी छूटने के दो महीने बाद ही।",
    claimType: "FORM_19",
    formName: "Form 19",
    needsAmount: false,
    needsPurpose: false,
  },
  {
    id: "need-money-now",
    label: "I need some money urgently but I am still working",
    labelHi: "पैसों की सख़्त ज़रूरत है, नौकरी चल रही है",
    detail: "Takes out part of the balance without closing the account or losing your pension years.",
    detailHi: "खाता बंद किए बिना कुछ पैसा निकल जाता है, पेंशन के साल भी नहीं जाते।",
    claimType: "FORM_31",
    formName: "Form 31",
    needsAmount: true,
    needsPurpose: true,
  },
  {
    id: "pension-now",
    label: "I want to start my monthly pension",
    labelHi: "मासिक पेंशन शुरू करानी है",
    detail: "A pension every month for life. Needs ten years of service and age fifty or above.",
    detailHi: "जीवन भर हर महीने पेंशन। दस साल की नौकरी और पचास की उम्र ज़रूरी है।",
    claimType: "FORM_10D",
    formName: "Form 10D",
    needsAmount: false,
    needsPurpose: false,
  },
  {
    id: "pension-cash",
    label: "I want the pension amount as one payment, not monthly",
    labelHi: "पेंशन का पैसा एक बार में चाहिए, हर महीने नहीं",
    detail: "Possible only under ten years of service. Past that, it becomes a monthly pension instead.",
    detailHi: "दस साल से कम नौकरी पर ही मुमकिन है। उसके बाद यह मासिक पेंशन बन जाती है।",
    claimType: "FORM_10C",
    formName: "Form 10C",
    needsAmount: false,
    needsPurpose: false,
  },
  {
    id: "death-claim",
    label: "A family member has died and I am claiming on their behalf",
    labelHi: "परिवार के सदस्य की मृत्यु हो गई है, उनकी तरफ़ से क्लेम कर रहे हैं",
    detail: "Insurance and family pension for the nominee or legal heir.",
    detailHi: "नामिनी या क़ानूनी वारिस के लिए बीमा और परिवार पेंशन।",
    claimType: "FORM_5IF",
    formName: "Form 5IF / 20 / 10D",
    needsAmount: false,
    needsPurpose: false,
  },
];

export function needById(id: string): Need | undefined {
  return NEEDS.find((n) => n.id === id);
}

export interface PurposeOption {
  id: AdvancePurpose;
  label: string;
  labelHi: string;
  /** Shown so the member can see which purposes they clear on service alone. */
  minService: string;
}

export const PURPOSES: PurposeOption[] = [
  { id: "ILLNESS", label: "Medical treatment, mine or my family's", labelHi: "अपना या परिवार का इलाज", minService: "no minimum" },
  { id: "UNEMPLOYMENT", label: "I am out of work right now", labelHi: "अभी काम नहीं है", minService: "no minimum" },
  { id: "NATURAL_CALAMITY", label: "Flood, cyclone or other calamity", labelHi: "बाढ़, तूफ़ान या कोई आपदा", minService: "no minimum" },
  { id: "HOUSE_PURCHASE", label: "Buying or building a house", labelHi: "घर ख़रीदना या बनाना", minService: "5 years" },
  { id: "HOUSE_REPAIR", label: "Repairing my house", labelHi: "घर की मरम्मत", minService: "5 years" },
  { id: "EDUCATION", label: "My children's education", labelHi: "बच्चों की पढ़ाई", minService: "7 years" },
  { id: "MARRIAGE", label: "A marriage in the family", labelHi: "परिवार में शादी", minService: "7 years" },
  { id: "HOUSING_LOAN_REPAY", label: "Paying off a home loan", labelHi: "होम लोन चुकाना", minService: "10 years" },
];
