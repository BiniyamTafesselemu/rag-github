import { Router } from "express";
import { checkMergeability, getPullRequestDiff, getRepo } from "../services/github.service.js";

export const githubRouter = Router();

githubRouter.get("/repo/:owner/:repo", async (req, res) => {
  try {
    const data = await getRepo(req.params.owner, req.params.repo);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

githubRouter.get("/repo/:owner/:repo/pull/:number/mergeability", async (req, res) => {
  try {
    const data = await checkMergeability(req.params.owner, req.params.repo, Number(req.params.number));
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

githubRouter.get("/repo/:owner/:repo/pull/:number/diff", async (req, res) => {
  try {
    const diff = await getPullRequestDiff(req.params.owner, req.params.repo, Number(req.params.number));
    res.type("text/plain").send(diff);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});
