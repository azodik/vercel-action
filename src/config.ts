import * as core from "@actions/core";
import * as github from "@actions/github";
import * as parser from "action-input-parser";
import { type Config } from "./types";
import "dotenv/config";

// Constants
const PR_EVENTS = ["pull_request", "pull_request_target"] as const;
const DEFAULT_SHA = "XXXXXXX";

// Helper function to get input with proper typing
const getInput = <T>(
  name: string,
  options: Parameters<typeof parser.getInput>[1]
): T => {
  return parser.getInput(name, options) as T;
};

// Helper function to get boolean input
const getBooleanInput = (name: string, defaultValue: boolean): boolean => {
  return getInput<boolean>(name, { type: "boolean", default: defaultValue });
};

// Helper function to get array input
const getArrayInput = (
  name: string,
  defaultValue: string[] = []
): readonly string[] => {
  return getInput<string[]>(name, {
    type: "array",
    default: defaultValue,
  }) as readonly string[];
};

// Initialize configuration
const createConfig = (): Config => {
  const isPr = PR_EVENTS.includes(github.context.eventName as any);

  return {
    // Required tokens and IDs
    GITHUB_TOKEN: getInput<string>("GITHUB_TOKEN", {
      required: true,
    }),
    VERCEL_TOKEN: getInput<string>("VERCEL_TOKEN", { required: true }),
    VERCEL_ORG_ID: getInput<string>("VERCEL_ORG_ID", { required: true }),
    VERCEL_PROJECT_ID: getInput<string>("VERCEL_PROJECT_ID", {
      required: true,
    }),
    GITHUB_REPOSITORY: getInput<string>("GITHUB_REPOSITORY", {
      required: true,
    }),

    // Deployment settings
    PRODUCTION: getBooleanInput("PRODUCTION", !isPr),
    STAGING: getBooleanInput("STAGING", false),
    PREBUILT: getBooleanInput("PREBUILT", false),
    FORCE: getBooleanInput("FORCE", false),

    // GitHub integration settings
    GITHUB_DEPLOYMENT: getBooleanInput("GITHUB_DEPLOYMENT", true),
    CREATE_COMMENT: getBooleanInput("CREATE_COMMENT", true),
    DELETE_EXISTING_COMMENT: getBooleanInput("DELETE_EXISTING_COMMENT", true),
    ATTACH_COMMIT_METADATA: getBooleanInput("ATTACH_COMMIT_METADATA", true),
    DEPLOY_PR_FROM_FORK: getBooleanInput("DEPLOY_PR_FROM_FORK", false),
    TRIM_COMMIT_MESSAGE: getBooleanInput("TRIM_COMMIT_MESSAGE", false),

    // Labels and domains
    PR_LABELS: getArrayInput("PR_LABELS", ["deployed"]),
    ALIAS_DOMAINS: getArrayInput("ALIAS_DOMAINS", []),
    PR_PREVIEW_DOMAIN: (() => {
      const value = getInput<string | undefined>("PR_PREVIEW_DOMAIN", {});
      return value || undefined;
    })(),

    // Optional settings
    VERCEL_SCOPE: getInput<string | undefined>("VERCEL_SCOPE", {}) || undefined,
    GITHUB_DEPLOYMENT_ENV:
      getInput<string | undefined>("GITHUB_DEPLOYMENT_ENV", {}) || undefined,
    WORKING_DIRECTORY:
      getInput<string | undefined>("WORKING_DIRECTORY", {}) || undefined,
    BUILD_ENV: getArrayInput("BUILD_ENV", []),

    // Runtime flags
    RUNNING_LOCAL: process.env["RUNNING_LOCAL"] === "true",

    // Dynamic context (will be set by setDynamicVars)
    USER: "",
    REPOSITORY: "",
    SHA: "",
    IS_PR: false,
    PR_NUMBER: undefined,
    REF: "",
    BRANCH: "",
    LOG_URL: "",
    ACTOR: "",
    IS_FORK: false,
  } as unknown as Config;
};

// Initialize the context
const context = createConfig();

/**
 * Set dynamic variables based on GitHub context or environment
 */
const setDynamicVars = (): void => {
  // Parse repository name
  const [user, repo] = context.GITHUB_REPOSITORY.split("/");
  context.USER = user || "";
  context.REPOSITORY = repo || "";

  // Handle local development mode
  if (context.RUNNING_LOCAL) {
    setLocalVars();
    return;
  }

  // Handle GitHub Actions context
  setGitHubContextVars();
};

/**
 * Set variables for local development
 */
const setLocalVars = (): void => {
  context.SHA = process.env["SHA"] || DEFAULT_SHA;
  context.IS_PR = process.env["IS_PR"] === "true";

  const prNumber = process.env["PR_NUMBER"];
  if (prNumber) {
    context.PR_NUMBER = parseInt(prNumber, 10);
  }

  context.REF = process.env["REF"] || "refs/heads/master";
  context.BRANCH = process.env["BRANCH"] || "master";
  context.PRODUCTION = process.env["PRODUCTION"] === "true" || !context.IS_PR;
  context.LOG_URL =
    process.env["LOG_URL"] ||
    `https://github.com/${context.USER}/${context.REPOSITORY}`;
  context.ACTOR = process.env["ACTOR"] || context.USER;
  context.IS_FORK = process.env["IS_FORK"] === "true";
  context.TRIM_COMMIT_MESSAGE = process.env["TRIM_COMMIT_MESSAGE"] === "true";
};

/**
 * Set variables from GitHub context
 */
const setGitHubContextVars = (): void => {
  const isPr = PR_EVENTS.includes(github.context.eventName as any);
  context.IS_PR = isPr;
  context.LOG_URL = `https://github.com/${context.USER}/${context.REPOSITORY}/actions/runs/${process.env["GITHUB_RUN_ID"]}`;

  if (isPr) {
    setPullRequestVars();
  } else {
    setPushVars();
  }
};

/**
 * Set variables for pull request events
 */
const setPullRequestVars = (): void => {
  const payload = github.context.payload;
  context.PR_NUMBER = payload["number"];
  context.ACTOR = payload.pull_request?.["user"]?.login || "";
  context.REF = payload.pull_request?.["head"]?.ref || "";
  context.SHA = payload.pull_request?.["head"]?.sha || "";
  context.BRANCH = payload.pull_request?.["head"]?.ref || "";
  context.IS_FORK =
    payload.pull_request?.["head"]?.repo?.full_name !==
    context.GITHUB_REPOSITORY;
};

/**
 * Set variables for push events
 */
const setPushVars = (): void => {
  context.ACTOR = github.context.actor;
  context.REF = github.context.ref;
  context.SHA = github.context.sha;
  context.BRANCH = github.context.ref.substring(11); // Remove 'refs/heads/' prefix
};

// Initialize dynamic variables
setDynamicVars();

// Set secrets for security
core.setSecret(context.GITHUB_TOKEN);
core.setSecret(context.VERCEL_TOKEN);

// Debug configuration (excluding secrets)
const debugConfig = { ...context } as any;
delete debugConfig.GITHUB_TOKEN;
delete debugConfig.VERCEL_TOKEN;
core.debug(JSON.stringify(debugConfig, null, 2));

export default context;
