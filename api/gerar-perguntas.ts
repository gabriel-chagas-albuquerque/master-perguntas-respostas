import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  allowOnlyPost,
  generateQuestions,
  sendError,
  validateTheme,
} from "./_lib/gemini.js";

// Vercel Function: api/gerar-perguntas.ts -> POST /api/gerar-perguntas.
export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (!allowOnlyPost(request, response)) return;

  const { tema, askedQuestions } = request.body ?? {};
  if (!validateTheme(tema)) {
    return sendError(response, 400, "Informe um tema válido.");
  }
  if (!Array.isArray(askedQuestions) || askedQuestions.some((question) => typeof question !== "string")) {
    return sendError(response, 400, "askedQuestions deve ser um array de textos.");
  }

  const prompt = `
Você é o gerador de perguntas do jogo de tabuleiro Master.
Gere exatamente 10 perguntas inéditas sobre o tema "${tema}".

Perguntas que já foram usadas e não podem ser repetidas:
${JSON.stringify(askedQuestions)}

Regras obrigatórias:
- Responda somente com um array JSON válido, sem markdown, comentários ou texto adicional.
- Cada objeto deve ter exatamente as propriedades tema, pergunta e resposta. Não inclua id.
- O campo tema deve ser exatamente "${tema}", mantendo a acentuação e capitalização.
- Não repita nenhuma pergunta da lista recebida nem perguntas dentro desta resposta.
- As perguntas devem ser claras, factuais e ter uma resposta objetiva.

Formato:
[
  { "tema": "${tema}", "pergunta": "...", "resposta": "..." }
]
`;

  try {
    const questions = await generateQuestions(prompt, 10);
    return response.status(200).json(questions);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao gerar perguntas.";
    return sendError(response, 502, message);
  }
}
