import { Router } from "express";
import { classifyProblem } from "../services/llm/router.llm.js";
import { retrieveRelevantDocs } from "../services/rag/retrieve.js";
import { generateRecommendation } from "../services/llm/generator.llm.js";
import { proposeFix } from "../services/llm/codefix.llm.js";
import { pool } from "../config/db.js";

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
