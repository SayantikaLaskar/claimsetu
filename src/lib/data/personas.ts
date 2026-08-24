/**
 * Display copy for the demo records.
 *
 * Kept apart from members.ts so the member data stays a faithful mirror of what
 * EPFO holds, with no presentation concerns mixed in. Each blurb names the
 * situation, not the bug — a real member arrives knowing their situation and
 * nothing about the bug.
 */
export interface Persona {
  uan: string;
  name: string;
  /** One line a member would use to describe themselves. */
  blurb: string;
  blurbHi: string;
  /** The suggested starting point, so the demo has an obvious path. */
  suggestedNeed: string;
  /** What this record is here to demonstrate. Shown as prototype metadata. */
  demonstrates: string;
}

export const PERSONAS: Persona[] = [
  {
    uan: "900000000001",
    name: "Ramesh Kumar Yadav",
    blurb: "Auto parts factory, Bengaluru. Left in May, needs his ₹1.87 lakh.",
    blurbHi: "ऑटो पार्ट्स फ़ैक्टरी, बेंगलुरु। मई में नौकरी छूटी, ₹1.87 लाख चाहिए।",
    suggestedNeed: "left-job",
    demonstrates: "The ordinary case: four separate records disagree about his name, and his old employer never marked him as having left.",
  },
  {
    uan: "900000000002",
    name: "Sunita Devi",
    blurb: "Garment worker, ten years across two factories. Wants her pension.",
    blurbHi: "गारमेंट वर्कर, दो फ़ैक्टरियों में दस साल। पेंशन चाहती हैं।",
    suggestedNeed: "pension-now",
    demonstrates: "Service split across two PF numbers, so ten years of work reads as four — and a lifelong pension reads as ineligible.",
  },
  {
    uan: "900000000003",
    name: "Mohammed Irfan",
    blurb: "Logistics supervisor, Hyderabad, fifteen years. Wants to cash out.",
    blurbHi: "लॉजिस्टिक्स सुपरवाइज़र, हैदराबाद, पंद्रह साल। एक बार में पैसा चाहते हैं।",
    suggestedNeed: "pension-cash",
    demonstrates: "Asking for the wrong thing. The claim he is about to file is worth far less than the one he is entitled to.",
  },
  {
    uan: "900000000004",
    name: "Ganesh Patil",
    blurb: "Housekeeping contractor, Pune. Contract ended in June.",
    blurbHi: "हाउसकीपिंग ठेका, पुणे। जून में ठेका ख़त्म।",
    suggestedNeed: "left-job",
    demonstrates: "His employer deducted PF for three months and never deposited it — which is an offence, not a delay.",
  },
  {
    uan: "900000000005",
    name: "Lakshmi Narayanan",
    blurb: "Textile mill, Chennai, still working. Needs money for treatment.",
    blurbHi: "टेक्सटाइल मिल, चेन्नई, नौकरी चल रही है। इलाज के लिए पैसा चाहिए।",
    suggestedNeed: "need-money-now",
    demonstrates: "A clean record. Shows what a claim that is genuinely ready to file looks like — and what the ceiling on each purpose really is.",
  },
];

export function personaFor(uan: string): Persona | undefined {
  return PERSONAS.find((p) => p.uan === uan);
}
