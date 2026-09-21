import type { VercelRequest, VercelResponse } from "@vercel/node";

export const THEMES = [
  "Artes",
  "Ciência",
  "Entretenimento",
  "Esportes",
  "Geografia",
  "História",
] as const;

export type GeneratedQuestion = {
  tema: string;
  pergunta: string;
  resposta: string;
};

type GeminiResponse = {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
  }>;
};

const MODEL = "gemini-3.5-flash-lite";

export function sendError(response: VercelResponse, status: number, message: string) {
  return response.status(status).json({ error: message });
}

export function allowOnlyPost(request: VercelRequest, response: VercelResponse) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    sendError(response, 405, "Método não permitido. Use POST.");
    return false;
  }

  return true;
}

export function validateTheme(theme: unknown): theme is (typeof THEMES)[number] {
  return typeof theme === "string" && THEMES.includes(theme as (typeof THEMES)[number]);
}

function extractJson(text: string) {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    const jsonStart = text.indexOf("[");
    const jsonEnd = text.lastIndexOf("]");
    if (jsonStart === -1 || jsonEnd <= jsonStart) {
      throw new Error("O Gemini não retornou um JSON válido.");
    }
    return JSON.parse(text.slice(jsonStart, jsonEnd + 1)) as unknown;
  }
}

export function validateQuestions(value: unknown, expectedCount: number): GeneratedQuestion[] {
  if (!Array.isArray(value) || value.length !== expectedCount) {
    throw new Error(`A API retornou uma quantidade inválida de perguntas. Esperado: ${expectedCount}.`);
  }

  return value.map((item, index) => {
    if (
      typeof item !== "object" ||
      item === null ||
      typeof (item as GeneratedQuestion).tema !== "string" ||
      typeof (item as GeneratedQuestion).pergunta !== "string" ||
      typeof (item as GeneratedQuestion).resposta !== "string"
    ) {
      throw new Error(`A pergunta ${index + 1} retornada pela API está incompleta.`);
    }

    const question = item as GeneratedQuestion;
    return {
      tema: question.tema,
      pergunta: question.pergunta.trim(),
      resposta: question.resposta.trim(),
    };
  });
}

export async function generateQuestions(prompt: string, expectedCount: number) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("A variável GEMINI_API_KEY não está configurada na Vercel.");
  }

  const geminiResponse = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.9,
        },
      }),
    },
  );

  if (!geminiResponse.ok) {
    const details = await geminiResponse.text();
    throw new Error(`Falha na API do Gemini (${geminiResponse.status}): ${details}`);
  }

  const data = (await geminiResponse.json()) as GeminiResponse;
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error("O Gemini não retornou conteúdo.");
  }

  return validateQuestions(extractJson(text), expectedCount);
}
