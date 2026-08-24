import type { Locale } from "./i18n";

/**
 * Browser speech, and the case for replacing it.
 *
 * Voice matters more here than in most products. The median EPF member is a
 * factory or contract worker; the explanation of why their claim will fail runs
 * to a paragraph of legal cause and effect, and asking them to read that in a
 * second script on a five-inch screen is where a well-meaning interface quietly
 * excludes the people it was built for.
 *
 * So voice is wired to the Web Speech API, which is free, needs no key, and runs
 * on-device. It is genuinely useful and genuinely limited, and both halves are
 * stated in the interface rather than hidden:
 *
 *  - Synthesis quality for Indian languages varies by device and is poor on the
 *    cheap Android handsets that matter most here. Hindi often falls back to a
 *    Latin-reading voice that mangles Devanagari.
 *  - Recognition is Chrome-only in practice, needs a network round trip anyway,
 *    and handles code-mixed Hinglish — how people actually speak — badly.
 *  - Intent matching below is keyword lookup. It cannot understand "paisa
 *    chahiye bacche ki fees ke liye" as an education advance under paragraph 68K.
 *
 * See src/lib/openai.ts for where gpt-4o-mini-tts and gpt-4o-transcribe replace
 * both, and /integration for the costed argument.
 */

export const SPEECH_LANG: Record<Locale, string> = {
  en: "en-IN",
  hi: "hi-IN",
};

/**
 * Keyword routing from spoken words to a claim.
 *
 * Ordered most specific first, because "paisa" appears in almost every phrase a
 * member would say and would otherwise swallow the more precise matches.
 */
const INTENTS: Array<{ need: string; purpose?: string; words: string[] }> = [
  { need: "death-claim", words: ["death", "died", "expired", "mrityu", "मृत्यु", "गुजर", "nominee"] },
  { need: "pension-now", words: ["pension", "monthly", "पेंशन", "मासिक", "retire", "retirement"] },
  { need: "pension-cash", words: ["ek baar", "one time", "एक बार", "lump", "cash out", "withdraw pension"] },
  { need: "need-money-now", purpose: "ILLNESS", words: ["illness", "medical", "hospital", "ilaj", "इलाज", "बीमार", "operation", "treatment", "beemar"] },
  { need: "need-money-now", purpose: "EDUCATION", words: ["education", "school", "college", "fees", "padhai", "पढ़ाई", "फीस"] },
  { need: "need-money-now", purpose: "MARRIAGE", words: ["marriage", "wedding", "shaadi", "शादी", "vivah"] },
  { need: "need-money-now", purpose: "HOUSE_PURCHASE", words: ["house", "home", "ghar", "घर", "makan", "plot", "build"] },
  { need: "need-money-now", purpose: "UNEMPLOYMENT", words: ["no work", "unemploy", "bekar", "बेरोज़गार", "kaam nahi"] },
  { need: "left-job", words: ["left", "quit", "resign", "chhod", "छोड़", "naukri", "नौकरी", "full", "pura", "पूरा", "all my money", "sara paisa"] },
  { need: "need-money-now", purpose: "ILLNESS", words: ["paisa", "पैसा", "money", "urgent", "zaroorat", "ज़रूरत"] },
];

export interface IntentMatch {
  need: string;
  purpose?: string;
  /** The word that produced the match, shown so the guess is never opaque. */
  matchedOn: string;
}

export function matchIntent(transcript: string): IntentMatch | null {
  const t = transcript.toLowerCase();
  for (const intent of INTENTS) {
    const hit = intent.words.find((w) => t.includes(w));
    if (hit) return { need: intent.need, purpose: intent.purpose, matchedOn: hit };
  }
  return null;
}
