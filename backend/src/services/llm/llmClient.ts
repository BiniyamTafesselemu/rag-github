export interface LlmMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

/**
 * Calls Groq's free-tier API (OpenAI-compatible endpoint).
 * Same function is reused for all 3 roles — router, generator, codefix —
 * just pass a different `model` each time.
 */
export async function callLlm(model: string, apiKey: string, messages: LlmMessage[]): Promise<string> {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
    }),
  });

  if (!res.ok) {
    throw new Error(`Groq API error: ${res.status} ${await res.text()}`);
  }

  const data = await res.json();
  return data.choices[0].message.content;
}
