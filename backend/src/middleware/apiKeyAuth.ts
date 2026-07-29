import type { NextFunction, Request, Response } from "express";
import { env } from "../config/env.js";

/**
 * Simple shared-secret auth. The client must send:
 *   Authorization: Bearer <APP_API_KEY>
 * Good enough for a small trusted group; swap for real per-user auth
 * (e.g. Clerk, Auth.js) if this ever needs individual accounts.
 */
export function apiKeyAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.header("authorization");
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;

  if (!env.appApiKey) {
    // No key configured — fail closed rather than silently allowing everyone through.
    res.status(500).json({ error: "Server misconfigured: APP_API_KEY not set" });
    return;
  }

  if (token !== env.appApiKey) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  next();
}
