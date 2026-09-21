import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  THEMES,
  allowOnlyPost,
  generateQuestions,
  sendError,
} from "./_lib/gemini.js";

// Vercel Function: api/iniciar-jogo.ts -> POST /api/iniciar-jogo.
export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (!allowOnlyPost(request, response)) return;

  const createPrompt = (theme: string) => `
Você é o gerador de perguntas do jogo de tabuleiro Master.
Gere exatamente 3 perguntas inéditas sobre o tema "${theme}".

Regras obrigatórias:
- Responda somente com um array JSON válido, sem markdown, comentários ou texto adicional.
- Cada objeto deve ter exatamente as propriedades tema, pergunta e resposta. Não inclua id.
- O campo tema deve ser exatamente "${theme}", respeitando acentos e capitalização.
- As perguntas devem ser claras, factuais e ter uma resposta objetiva.
- Não repita perguntas dentro desta resposta.

Formato:
[
  { "tema": "${theme}", "pergunta": "...", "resposta": "..." }
]
`;

  try {
    const questionsByTheme = await Promise.all(
      THEMES.map((theme) => generateQuestions(createPrompt(theme), 3)),
    );
    return response.status(200).json(questionsByTheme.flat());
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao iniciar o jogo.";
    return sendError(response, 502, message);
  }
}
