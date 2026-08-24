/**
 * Name and date comparison helpers.
 *
 * These exist because the single largest cause of EPF claim rejection is not
 * fraud or ineligibility — it is a name that differs between two government
 * records by an initial, a suffix, or a transliteration. EPFO's matcher is
 * effectively exact; ours has to be able to tell "same person, different
 * spelling" apart from "genuinely different name", because the repair path is
 * completely different in each case.
 */

const HONORIFICS = new Set([
  "mr", "mrs", "ms", "shri", "sri", "smt", "kumari", "km", "dr", "late",
]);

/** Common surname/name suffixes that EPFO records drop and Aadhaar keeps. */
const NOISE = new Set(["s/o", "d/o", "w/o", "."]);

export function normaliseName(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[^a-z\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t && !HONORIFICS.has(t) && !NOISE.has(t))
    .join(" ")
    .trim();
}

export function nameTokens(raw: string): string[] {
  return normaliseName(raw).split(" ").filter(Boolean);
}

export type NameVerdict =
  /** Byte-identical after normalisation. EPFO will accept. */
  | "EXACT"
  /** Same tokens, one side abbreviates: "RAJESH K SINGH" vs "RAJESH KUMAR SINGH". */
  | "INITIAL_EXPANSION"
  /** Tokens reordered: "SINGH RAJESH" vs "RAJESH SINGH". */
  | "REORDERED"
  /** A whole token present on one side only: missing middle or surname. */
  | "TOKEN_MISSING"
  /** Same-sounding but differently spelt: "SAYANTIKA" vs "SAYANTIKAA". */
  | "SPELLING"
  /** No meaningful overlap. Likely a different person or a data-entry disaster. */
  | "DIFFERENT";

/** Crude but deterministic soundex-ish key, adequate for Indic transliteration. */
function phoneticKey(token: string): string {
  return token
    .replace(/aa/g, "a").replace(/ee/g, "i").replace(/oo/g, "u")
    .replace(/[aeiou]/g, "")
    .replace(/(.)\1+/g, "$1")
    .replace(/ph/g, "f").replace(/ck/g, "k").replace(/[wv]/g, "v")
    .replace(/[sz]/g, "s").replace(/[jz]/g, "j");
}

export function compareNames(a: string, b: string): NameVerdict {
  const ta = nameTokens(a);
  const tb = nameTokens(b);
  if (ta.join(" ") === tb.join(" ")) return "EXACT";
  if (ta.length === 0 || tb.length === 0) return "DIFFERENT";

  const setA = new Set(ta);
  const setB = new Set(tb);
  const shared = ta.filter((t) => setB.has(t));

  // Same multiset, different order.
  if (ta.length === tb.length && shared.length === ta.length) return "REORDERED";

  // One side uses an initial where the other spells the token out.
  const [shortSide, longSide] = ta.length <= tb.length ? [ta, tb] : [tb, ta];
  if (shortSide.length === longSide.length) {
    const initialExpansion = shortSide.every((t, i) => {
      const other = longSide[i];
      return t === other || (t.length === 1 && other.startsWith(t)) || (other.length === 1 && t.startsWith(other));
    });
    if (initialExpansion) return "INITIAL_EXPANSION";
  }

  // A whole token exists on one side only, but everything else lines up.
  if (shared.length === shortSide.length && shortSide.length > 0) return "TOKEN_MISSING";

  // Same number of tokens, each pair sounds alike.
  if (ta.length === tb.length) {
    const allPhoneticallyEqual = ta.every((t, i) => phoneticKey(t) === phoneticKey(tb[i]));
    if (allPhoneticallyEqual) return "SPELLING";
  }

  if (shared.length > 0) return "SPELLING";
  return "DIFFERENT";
}

/** True when EPFO's exact matcher would reject the pair. */
export function nameWouldFailEpfo(verdict: NameVerdict): boolean {
  return verdict !== "EXACT";
}

export function diffNames(a: string, b: string): { a: string; b: string; verdict: NameVerdict } {
  return { a: a.trim(), b: b.trim(), verdict: compareNames(a, b) };
}
