# Master

## Desenvolvimento local com Gemini

Crie um arquivo `.env` na raiz do projeto com a chave do Google AI Studio:

```env
GEMINI_API_KEY=sua-chave-aqui
```

Para executar o frontend junto com as Serverless Functions em `api/`, use:

```bash
npm run dev:vercel
```

Não use apenas `npm run dev` para testar o Gemini: o Vite serve a interface, mas não executa as funções da Vercel. O comando `dev:vercel` disponibiliza as rotas `POST /api/iniciar-jogo` e `POST /api/gerar-perguntas`.

Em produção, configure `GEMINI_API_KEY` nas Environment Variables do projeto na Vercel. A chave permanece somente no backend.# React + TypeScript + Vite
