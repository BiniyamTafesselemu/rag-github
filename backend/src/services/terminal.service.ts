import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

/**
 * Runs commands inside a throwaway Docker container built from
 * sandbox/Dockerfile (Alpine + git only, no Node, no secrets).
 * Each call spins up a fresh container, mounts the target repo path
 * read-write, runs the command, captures output, and removes itself
 * (`--rm`).
 */

const ALLOWED_COMMANDS = ["git", "ls", "cat", "pwd", "diff", "status"];
const SANDBOX_IMAGE = "rag-git-sandbox";
const TIMEOUT_MS = 15_000;

export interface CommandResult {
  command: string;
  output: string;
  exitCode: number;
}

function isAllowed(command: string): boolean {
  const topLevel = command.trim().split(/\s+/)[0];
  return ALLOWED_COMMANDS.includes(topLevel);
}

export async function runCommand(command: string, cwd: string): Promise<CommandResult> {
  if (!isAllowed(command)) {
    throw new Error(`Command not allowed by sandbox whitelist: "${command}"`);
  }
  if (!cwd || !cwd.trim() || !cwd.startsWith("/")) {
    throw new Error(`cwd must be a non-empty absolute path, got: "${cwd}"`);
  }

  const commandParts = command.trim().split(/\s+/);

  const dockerArgs = [
    "run",
    "--rm",
    "--network=none",
    "--memory=256m",
    "--cpus=0.5",
    "-v",
    `${cwd}:/repo`,
    SANDBOX_IMAGE,
    ...commandParts,
  ];

  try {
    const { stdout, stderr } = await execFileAsync("docker", dockerArgs, { timeout: TIMEOUT_MS });
    return { command, output: stdout + stderr, exitCode: 0 };
  } catch (err: any) {
    // execFile throws on non-zero exit codes; err.code is the exit code, err.stdout/stderr still populated.
    return {
      command,
      output: (err.stdout ?? "") + (err.stderr ?? ""),
      exitCode: typeof err.code === "number" ? err.code : 1,
    };
  }
}