import express from "express";
import cors from "cors";
import { env } from "./config/env.js";
import { ensureSchema } from "./config/db.js";
import { analyzeRouter } from "./routes/analyze.routes.js";
import { githubRouter } from "./routes/github.routes.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();
app.use(cors({ origin: env.frontendOrigin }));
app.use(express.json({ limit: "5mb" }));

app.get("/health", (_req, res) => res.json({ ok: true }));
app.use("/api", analyzeRouter);
app.use("/api", githubRouter);

app.use(errorHandler);

async function start() {
  await ensureSchema();
  app.listen(env.port, () => {
    console.log(`Backend listening on http://localhost:${env.port}`);
  });
}

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
