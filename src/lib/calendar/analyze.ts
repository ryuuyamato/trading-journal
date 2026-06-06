import Anthropic from "@anthropic-ai/sdk";
import { getInstrumentsForCurrency } from "./impact-map";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export interface AnalysisResult {
  summary: string;
  bias: string;
  instruments: string[];
}

export async function analyzeEvent(
  title: string,
  country: string,
  forecast: string | null,
  previous: string | null,
  actual: string | null,
): Promise<AnalysisResult> {
  const instrumentsList = getInstrumentsForCurrency(country);

  const prompt = `Kamu adalah analis pasar forex dan komoditas berpengalaman.

Event Ekonomi: ${title}
Negara/Mata Uang: ${country}
${forecast ? `Forecast: ${forecast}` : ""}
${previous ? `Previous: ${previous}` : ""}
${actual ? `Actual: ${actual}` : ""}

Instrumen yang terdampak: ${instrumentsList.join(", ") || "tidak diketahui"}

Analisis dampak event ini terhadap pasar dengan mempertimbangkan:
1. Apa arti event ini untuk nilai mata uang?
2. Bagaimana data actual vs forecast mempengaruhi sentimen?
3. Instrumen mana yang paling terdampak dan bagaimana arahnya?

Balas dalam format JSON berikut (tanpa markdown):
{
  "summary": "ringkasan singkat 2-3 kalimat tentang dampak event ini",
  "bias": "BULLISH_USD / BEARISH_USD / BULLISH_EUR / dll (mata uang + arah)",
  "instruments": ["instrumen yang paling relevan", "maksimal 5"]
}`;

  const message = await client.messages.create({
    model: "claude-opus-4-8",
    max_tokens: 1024,
    thinking: { type: "adaptive" },
    messages: [{ role: "user", content: prompt }],
  });

  const textBlock = message.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text response from Claude");
  }

  try {
    const jsonStr = textBlock.text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(jsonStr);
    return {
      summary: parsed.summary ?? "",
      bias: parsed.bias ?? "",
      instruments: Array.isArray(parsed.instruments) ? parsed.instruments.slice(0, 5) : instrumentsList.slice(0, 5),
    };
  } catch {
    return {
      summary: textBlock.text.slice(0, 500),
      bias: "",
      instruments: instrumentsList.slice(0, 5),
    };
  }
}
