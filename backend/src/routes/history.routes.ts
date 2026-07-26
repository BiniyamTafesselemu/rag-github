import { Router } from "express";
import { pool } from "../config/db.js";

export const historyRouter = Router();

historyRouter.get("/sessions", async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, repo, error_text, classification, recommendation, suggested_commands, created_at
       FROM sessions
       ORDER BY created_at DESC
       LIMIT 20`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});
