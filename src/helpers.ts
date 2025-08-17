import * as core from "@actions/core";
import { spawn, type SpawnOptions } from "child_process";

// URL schema constants
const URL_SCHEMA_REGEX = /^https?:\/\//;

/**
 * Execute a command with better error handling and logging
 */
const execCmd = async (
  command: string,
  args: readonly string[],
  cwd?: string
): Promise<string> => {
  core.debug(`EXEC: "${command} ${args.join(" ")}" in ${cwd || "."}`);

  return new Promise((resolve, reject) => {
    const options: SpawnOptions = {
      cwd,
      stdio: ["pipe", "pipe", "pipe"],
    };

    const process = spawn(command, args, options);
    let stdout = "";
    let stderr = "";

    // Handle stdout
    process.stdout?.on("data", (data: Buffer) => {
      const output = data.toString();
      core.debug(output);
      stdout += output;
    });

    // Handle stderr
    process.stderr?.on("data", (data: Buffer) => {
      const output = data.toString();
      core.debug(output);
      stderr += output;
    });

    // Handle process completion
    process.on("close", (code: number | null) => {
      if (code !== 0) {
        const error = stderr || `Command failed with exit code ${code}`;
        reject(new Error(error));
      } else {
        resolve(stdout.trim());
      }
    });

    // Handle process errors
    process.on("error", (error: Error) => {
      reject(new Error(`Failed to start process: ${error.message}`));
    });
  });
};

/**
 * Add HTTPS schema to URL if missing
 */
const addSchema = (url: string): string => {
  return URL_SCHEMA_REGEX.test(url) ? url : `https://${url}`;
};

/**
 * Remove HTTP/HTTPS schema from URL
 */
const removeSchema = (url: string): string => {
  return url.replace(URL_SCHEMA_REGEX, "");
};

/**
 * Validate and sanitize URL
 */
const validateUrl = (url: string): boolean => {
  try {
    new URL(addSchema(url));
    return true;
  } catch {
    return false;
  }
};

/**
 * Create a safe filename from string
 */
const sanitizeFilename = (str: string): string => {
  return str.replace(/[^a-z0-9]/gi, "-").toLowerCase();
};

export {
  execCmd as exec,
  addSchema,
  removeSchema,
  validateUrl,
  sanitizeFilename,
};
