import * as pty from "node-pty";

// This is a sandboxed terminal service that allows running a limited set of commands in a controlled environment.

const ALLOWED_COMMANDS = ["git", "ls", "cat", "pwd", "diff", "status"];

export interface CommandResult {
  command: string;
  output: string;
  exitCode: number;
}

function isAllowed(command: string): boolean {
  const topLevel = command.trim().split(/\s+/)[0];
  return ALLOWED_COMMANDS.includes(topLevel);
}

export function runCommand(command: string, cwd: string): Promise<CommandResult> {
  return new Promise((resolve, reject) => {
    if (!isAllowed(command)) {
      reject(new Error(`Command not allowed by sandbox whitelist: "${command}"`));
      return;
    }

    const [cmd, ...args] = command.trim().split(/\s+/);
    let output = "";

    const proc = pty.spawn(cmd, args, {
      name: "xterm-color",
      cols: 120,
      rows: 30,
      cwd,
      env: process.env as Record<string, string>,
    });

    proc.onData((data) => {
      output += data;
    });

    proc.onExit(({ exitCode }) => {
      resolve({ command, output, exitCode });
    });
  });
}
