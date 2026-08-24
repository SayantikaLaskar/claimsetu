"use client";

import { useState } from "react";

/**
 * The document body, with a copy button.
 *
 * Copy matters more than download here: the most common way this text actually
 * reaches an employer is pasted into WhatsApp, and the most common device is a
 * phone where a downloaded .txt file is hard to find again.
 */
export function CopyBlock({ text, label }: { text: string; label: string }) {
  const [state, setState] = useState<"idle" | "done" | "failed">("idle");

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setState("done");
      setTimeout(() => setState("idle"), 2500);
    } catch {
      setState("failed");
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={copy}
          className="rounded-lg bg-brand px-3.5 py-2.5 text-[0.88rem] font-semibold text-white"
        >
          {state === "done" ? "Copied" : label}
        </button>
        <button
          type="button"
          onClick={() => window.print()}
          className="rounded-lg border border-line-strong px-3.5 py-2.5 text-[0.88rem] font-semibold text-ink"
        >
          Print
        </button>
        {state === "failed" && (
          <span className="text-[0.8rem] text-stop">
            Could not copy — select the text below instead.
          </span>
        )}
      </div>

      <pre className="mt-3 overflow-x-auto rounded-lg border border-line bg-card px-3.5 py-3.5 font-mono text-[0.76rem] leading-relaxed whitespace-pre text-ink">
        {text}
      </pre>
    </div>
  );
}
