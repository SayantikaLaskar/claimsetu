"use client";

import { useEffect, useState } from "react";
import { SPEECH_LANG } from "@/lib/speech";
import type { Locale } from "@/lib/i18n";

/**
 * Read-aloud, using the device's own voices.
 *
 * Renders nothing when the browser has no speech synthesis, rather than showing
 * a button that does nothing — a dead control is worse than an absent one for
 * someone who is relying on it.
 */
export function SpeakButton({
  text,
  locale,
  label = "Listen",
  className = "",
}: {
  text: string;
  locale: Locale;
  label?: string;
  className?: string;
}) {
  const [available, setAvailable] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    setAvailable(typeof window !== "undefined" && "speechSynthesis" in window);
    return () => window.speechSynthesis?.cancel();
  }, []);

  if (!available) return null;

  function toggle() {
    const synth = window.speechSynthesis;
    if (speaking) {
      synth.cancel();
      setSpeaking(false);
      return;
    }
    synth.cancel();

    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = SPEECH_LANG[locale];
    // Slower than default: this is unfamiliar, consequential information.
    utter.rate = 0.92;

    const match = synth
      .getVoices()
      .find((v) => v.lang === SPEECH_LANG[locale]) ??
      synth.getVoices().find((v) => v.lang.startsWith(locale));
    if (match) utter.voice = match;

    utter.onend = () => setSpeaking(false);
    utter.onerror = () => setSpeaking(false);
    setSpeaking(true);
    synth.speak(utter);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-live="polite"
      className={`no-print inline-flex items-center gap-1.5 text-[0.78rem] font-semibold text-brand ${className}`}
    >
      <span aria-hidden>{speaking ? "◼" : "▶"}</span>
      {speaking ? "Stop" : label}
    </button>
  );
}
