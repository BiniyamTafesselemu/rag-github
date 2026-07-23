import { Router } from "express";
import { runCommand } from "../services/terminal.service.js";

export const terminalRouter = Router();

terminalRouter.post("/terminal/run", async (req, res) => {
  try {
    const { command, cwd } = req.body as { command: string; cwd: string };
    const result = await runCommand(command, cwd);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});
