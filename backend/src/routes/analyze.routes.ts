import { Router } from "express";
import { classifyProblem } from "../services/llm/router.llm.js";
import { retrieveRelevantDocs } from "../services/rag/retrieve.js";
import { generateRecommendation } from "../services/llm/generator.llm.js";
import { proposeFix } from "../services/llm/codefix.llm.js";
import { pool } from "../config/db.js";
import { streamRecommendation } from "../services/llm/generator.llm.js";

export const analyzeRouter = Router();

analyzeRouter.post("/analyze", async (req, res) => {
  try {
    const { terminalOutput, diff, repo } = req.body as {
      terminalOutput?: string;
      diff?: string;
      repo?: string;
    };

    if (!terminalOutput && !diff) {
      res.status(400).json({ error: "Provide terminalOutput and/or diff" });
      return;
    }

    const routing = await classifyProblem({ terminalOutput, diff });
    const chunks = await retrieveRelevantDocs(routing.searchQuery);

    const recommendation = await generateRecommendation({
      problemDescription: terminalOutput ?? diff ?? "",
      chunks,
    });

    const fixPlan = await proposeFix({ recommendation, terminalOutput });

    await pool.query(
      `INSERT INTO sessions (repo, error_text, classification, recommendation, suggested_commands)
       VALUES ($1, $2, $3, $4, $5)`,
      [repo ?? null, terminalOutput ?? diff, routing.classification, recommendation, fixPlan.commands]
    );

    res.json({
      classification: routing.classification,
      sources: chunks.map((c) => ({ url: c.sourceUrl, title: c.title })),
      recommendation,
      fixPlan,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: (err as Error).message });
  }
});


analyzeRouter.post("/analyze/stream", async (req, res) => {
  try {
    const { terminalOutput, diff, repo } = req.body as {
      terminalOutput?: string;
      diff?: string;
      repo?: string;
    };

    if (!terminalOutput && !diff) {
      res.status(400).json({ error: "Provide terminalOutput and/or diff" });
      return;
    }

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const routing = await classifyProblem({ terminalOutput, diff });
    res.write(`event: classification\ndata: ${JSON.stringify(routing)}\n\n`);

    const chunks = await retrieveRelevantDocs(routing.searchQuery);
    res.write(`event: sources\ndata: ${JSON.stringify(chunks.map((c) => ({ url: c.sourceUrl, title: c.title })))}\n\n`);

    let fullText = "";
    await streamRecommendation({ problemDescription: terminalOutput ?? diff ?? "", chunks }, (token) => {
      fullText += token;
      res.write(`event: token\ndata: ${JSON.stringify(token)}\n\n`);
    });

    const fixPlan = await proposeFix({ recommendation: fullText, terminalOutput });
    res.write(`event: fixplan\ndata: ${JSON.stringify(fixPlan)}\n\n`);

    await pool.query(
      `INSERT INTO sessions (repo, error_text, classification, recommendation, suggested_commands)
       VALUES ($1, $2, $3, $4, $5)`,
      [repo ?? null, terminalOutput ?? diff, routing.classification, fullText, fixPlan.commands]
    );

    res.write(`event: done\ndata: {}\n\n`);
    res.end();
  } catch (err) {
    res.write(`event: error\ndata: ${JSON.stringify({ error: (err as Error).message })}\n\n`);
    res.end();
  }
});