"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { SPEECH_LANG, matchIntent } from "@/lib/speech";
import { needById } from "@/lib/needs";
import type { Locale } from "@/lib/i18n";

/* Minimal shape of the vendor-prefixed API. */
interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
}
type RecognitionCtor = new () => SpeechRecognitionLike;

/**
 * Speak instead of reading.
 *
 * The member says what they need; we route it to a claim. The transcript and the
 * word that produced the match are both shown, because a system that guesses
 * silently on someone's savings is worse than one that asks. The member confirms
 * before anything happens.
 */
export function VoiceIntake({ locale }: { locale: Locale }) {
  const router = useRouter();
  const recognition = useRef<SpeechRecognitionLike | null>(null);

  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const w = window as unknown as {
      SpeechRecognition?: RecognitionCtor;
      webkitSpeechRecognition?: RecognitionCtor;
    };
    const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!Ctor) return;

    setSupported(true);
    const r = new Ctor();
    r.lang = SPEECH_LANG[locale];
    r.continuous = false;
    r.interimResults = false;

    r.onresult = (e) => {
      const said = Array.from({ length: e.results.length }, (_, i) => e.results[i][0].transcript)
        .join(" ")
        .trim();
      setTranscript(said);
      setError("");
    };
    r.onerror = (e) => {
      setError(
        e.error === "not-allowed"
          ? "Microphone permission was refused. You can pick from the list below instead."
          : "Could not hear that. Try again, or pick from the list below.",
      );
      setListening(false);
    };
    r.onend = () => setListening(false);

    recognition.current = r;
    return () => r.stop();
  }, [locale]);

  if (!supported) return null;

  const match = transcript ? matchIntent(transcript) : null;
  const matchedNeed = match ? needById(match.need) : undefined;

  function listen() {
    setTranscript("");
    setError("");
    try {
      recognition.current?.start();
      setListening(true);
    } catch {
      setListening(false);
    }
  }

  function go() {
    if (!match || !matchedNeed) return;
    const params = new URLSearchParams({ need: match.need, lang: locale });
    if (match.purpose) params.set("purpose", match.purpose);
    // A purpose-bearing claim still needs an amount, so route through the form.
    router.push(
      matchedNeed.needsPurpose
        ? `/portal/claim?${params.toString()}`
        : `/portal/claim/check?${params.toString()}`,
    );
  }

  return (
    <div className="no-print rounded-[--radius-card] border border-brand/25 bg-brand-wash p-4">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={listen}
          disabled={listening}
          className="inline-flex items-center gap-2 rounded-[--radius-card] bg-brand px-4 py-3 text-[0.92rem] font-semibold text-white disabled:opacity-70"
        >
          <span aria-hidden>{listening ? "●" : "🎤"}</span>
          {listening ? "Listening…" : "Just say it out loud"}
        </button>
        <p className="text-[0.8rem] leading-snug text-brand-ink">
          Say why you need the money. We will work out the form.
        </p>
      </div>

      {transcript && (
        <div className="mt-3 border-t border-brand/20 pt-3">
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.09em] text-ink-faint">
            We heard
          </p>
          <p className="mt-1 text-[0.95rem] font-medium text-ink">&ldquo;{transcript}&rdquo;</p>

          {matchedNeed ? (
            <>
              <p className="mt-2.5 text-[0.86rem] leading-relaxed text-ink-soft">
                Matched on the word <strong className="font-semibold text-ink">{match!.matchedOn}</strong> →{" "}
                <strong className="font-semibold text-ink">{matchedNeed.formName}</strong>,{" "}
                {matchedNeed.label.toLowerCase()}.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={go}
                  className="rounded-[--radius-card] bg-brand px-4 py-2.5 text-[0.88rem] font-semibold text-white"
                >
                  Yes, that&rsquo;s right →
                </button>
                <button
                  type="button"
                  onClick={() => setTranscript("")}
                  className="rounded-[--radius-card] border border-line-strong bg-card px-4 py-2.5 text-[0.88rem] font-semibold text-ink"
                >
                  No, let me pick
                </button>
              </div>
            </>
          ) : (
            <p className="mt-2 text-[0.86rem] leading-relaxed text-ink-soft">
              That did not match any claim we know. Pick from the list below.
            </p>
          )}
        </div>
      )}

      {error && (
        <p role="alert" className="mt-3 text-[0.84rem] leading-relaxed text-stop">
          {error}
        </p>
      )}

      <p className="mt-3 border-t border-brand/20 pt-2.5 text-[0.74rem] leading-relaxed text-ink-faint">
        Runs on your device, free, nothing uploaded. It is keyword matching, so it
        will miss anything phrased unusually — see{" "}
        <a href="/integration#voice" className="underline underline-offset-2">
          where a model would replace this
        </a>
        .
      </p>
    </div>
  );
}
