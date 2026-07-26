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
/**
 * Same as callLlm, but streams tokens as they arrive instead of waiting
 * for the full response. Calls onToken for each text chunk received.
 */
export async function streamLlm(
  model: string,
  apiKey: string,
  messages: LlmMessage[],
  onToken: (chunk: string) => void
): Promise<void> {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model, messages, stream: true }),
  });

  if (!res.ok || !res.body) {
    throw new Error(`Groq API error: ${res.status} ${await res.text()}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const payload = trimmed.slice(5).trim();
      if (payload === "[DONE]") return;

      try {
        const json = JSON.parse(payload);
        const token = json.choices?.[0]?.delta?.content;
        if (token) onToken(token);
      } catch {
        // ignore malformed SSE lines
      }
    }
  }
}