export type GeneratedQuestion = {
  tema: string;
  pergunta: string;
  resposta: string;
};

async function readApiResponse<T>(response: Response): Promise<T> {
  const responseText = await response.text();
  let data: T | { error?: string };

  try {
    data = JSON.parse(responseText) as T | { error?: string };
  } catch {
    throw new Error(
      `A API respondeu com status ${response.status}, mas não retornou JSON válido. Verifique se as funções Vercel estão em execução.`,
    );
  }

  if (!response.ok) {
    const message = data && typeof data === "object" && "error" in data
      ? data.error
      : undefined;
    throw new Error(
      message || `A API respondeu com status ${response.status}. Verifique se as funções Vercel estão em execução.`,
    );
  }

  return data as T;
}

// Frontend: chama a Vercel Function api/iniciar-jogo.ts.
export async function iniciarTabuleiro(): Promise<GeneratedQuestion[]> {
  try {
    const response = await fetch("/api/iniciar-jogo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    return await readApiResponse<GeneratedQuestion[]>(response);
  } catch (error) {
    const message = error instanceof Error
      ? error.message
      : "Não foi possível iniciar o jogo.";
    throw new Error(`Falha ao iniciar o tabuleiro: ${message}`, { cause: error });
  }
}

// Frontend: chama a Vercel Function api/gerar-perguntas.ts.
export async function buscarMaisPerguntas(
  tema: string,
  askedQuestions: string[],
): Promise<GeneratedQuestion[]> {
  try {
    const response = await fetch("/api/gerar-perguntas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tema, askedQuestions }),
    });

    return await readApiResponse<GeneratedQuestion[]>(response);
  } catch (error) {
    const message = error instanceof Error
      ? error.message
      : "Não foi possível gerar mais perguntas.";
    throw new Error(`Falha ao gerar perguntas de ${tema}: ${message}`, { cause: error });
  }
}
