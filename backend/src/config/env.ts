import "dotenv/config";

export const env = {
  port: Number(process.env.PORT ?? 4000),
  frontendOrigin: process.env.FRONTEND_ORIGIN ?? "http://localhost:3000",

  databaseUrl: process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/rag_github",

  githubToken: process.env.GITHUB_TOKEN ?? "",

  groq: {
    apiKey: process.env.GROQ_API_KEY ?? "",
    routerModel: process.env.ROUTER_MODEL ?? "llama-3.1-8b-instant",
    generatorModel: process.env.GENERATOR_MODEL ?? "llama-3.3-70b-versatile",
    codefixModel: process.env.CODEFIX_MODEL ?? "qwen/qwen3-32b",
  },
};
