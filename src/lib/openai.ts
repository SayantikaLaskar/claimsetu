/**
 * OpenAI client.
 *
 * Three jobs, and only three. The model translates, listens, and speaks. It does
 * not decide anything — every verdict in this product comes from the rule
 * catalogue in src/lib/engine/rules.ts, which is deterministic and auditable.
 *
 * That boundary is the design. A citizen being told "your claim will be
 * rejected" is being given information they will act on for three weeks, and
 * that claim has to be traceable to a written rule, not to a sampled token. But
 * rendering a rule into Bhojpuri-accented Hindi, or reading it aloud to someone
 * who cannot read it, is exactly what a model is for — approximately right is
 * genuinely useful there, and the alternative is nothing at all.
 */

const API = "https://api.openai.com/v1";

/** Text work: translation and free-text intake. */
export const TEXT_MODEL = "gpt-5.1";
/** Speech to text. Handles Indian-language speech and code-mixing. */
export const TRANSCRIBE_MODEL = "gpt-4o-transcribe";
/** Text to speech, for members who cannot read the script they speak. */
export const TTS_MODEL = "gpt-4o-mini-tts";

export function hasKey(): boolean {
  return !!process.env.OPENAI_API_KEY;
}

function key(): string {
  const k = process.env.OPENAI_API_KEY;
  if (!k) throw new Error("OPENAI_API_KEY is not set");
  return k;
}

export interface RespondOptions {
  model?: string;
  instructions?: string;
  /** Force a JSON object shape. Pass a JSON Schema. */
  schema?: { name: string; schema: Record<string, unknown> };
  reasoningEffort?: "none" | "low" | "medium" | "high";
  maxOutputTokens?: number;
}

/**
 * One call to the Responses API, returning the output text.
 * Retries once on a 429 or 5xx, then gives up — the caller always has a
 * usable fallback, so failing fast beats blocking a page render.
 */
export async function respond(input: string, opts: RespondOptions = {}): Promise<string> {
  const body: Record<string, unknown> = {
    model: opts.model ?? TEXT_MODEL,
    input,
    ...(opts.instructions ? { instructions: opts.instructions } : {}),
    ...(opts.maxOutputTokens ? { max_output_tokens: opts.maxOutputTokens } : {}),
    ...(opts.reasoningEffort ? { reasoning: { effort: opts.reasoningEffort } } : {}),
    ...(opts.schema
      ? {
          text: {
            format: {
              type: "json_schema",
              name: opts.schema.name,
              schema: opts.schema.schema,
              strict: true,
            },
          },
        }
      : {}),
  };

  let lastError = "";
  for (let attempt = 0; attempt < 2; attempt++) {
    const res = await fetch(`${API}/responses`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      const json = await res.json();
      return extractText(json);
    }

    lastError = `${res.status} ${await res.text()}`;
    if (res.status !== 429 && res.status < 500) break;
  }
  throw new Error(`OpenAI responses failed: ${lastError}`);
}

/** The Responses API nests output; pull out the concatenated text. */
function extractText(json: unknown): string {
  const j = json as {
    output_text?: string;
    output?: Array<{ type: string; content?: Array<{ type: string; text?: string }> }>;
  };
  if (typeof j.output_text === "string" && j.output_text) return j.output_text;

  const parts: string[] = [];
  for (const item of j.output ?? []) {
    for (const c of item.content ?? []) {
      if (c.type === "output_text" && c.text) parts.push(c.text);
    }
  }
  return parts.join("").trim();
}

/** Speech to text. `language` is an ISO-639-1 hint, which materially helps. */
export async function transcribe(
  audio: Blob,
  language?: string,
): Promise<string> {
  const form = new FormData();
  form.append("file", audio, "speech.webm");
  form.append("model", TRANSCRIBE_MODEL);
  if (language) form.append("language", language);
  // Priming the model with the vocabulary it is about to hear cuts errors on
  // exactly the terms that matter here.
  form.append(
    "prompt",
    "The speaker is talking about their Indian provident fund (PF, EPF, EPFO, UAN, Aadhaar, KYC, pension, withdrawal, advance, employer). They may mix Hindi or a regional language with English.",
  );

  const res = await fetch(`${API}/audio/transcriptions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key()}` },
    body: form,
  });
  if (!res.ok) throw new Error(`transcription failed: ${res.status} ${await res.text()}`);
  const json = (await res.json()) as { text?: string };
  return (json.text ?? "").trim();
}

/** Text to speech. Returns MP3 bytes. */
export async function speak(text: string, instructions?: string): Promise<ArrayBuffer> {
  const res = await fetch(`${API}/audio/speech`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: TTS_MODEL,
      voice: "alloy",
      input: text,
      response_format: "mp3",
      ...(instructions ? { instructions } : {}),
    }),
  });
  if (!res.ok) throw new Error(`speech failed: ${res.status} ${await res.text()}`);
  return res.arrayBuffer();
}
