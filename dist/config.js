import * as core from "@actions/core";
import * as github from "@actions/github";
import parser from "action-input-parser";
import "dotenv/config";
const IS_PR = ["pull_request", "pull_request_target"].includes(github.context.eventName);
const context = {
    GITHUB_TOKEN: parser.getInput(["GH_PAT", "GITHUB_TOKEN"], {
        required: true,
    }),
    VERCEL_TOKEN: parser.getInput("VERCEL_TOKEN", { required: true }),
    VERCEL_ORG_ID: parser.getInput("VERCEL_ORG_ID", { required: true }),
    VERCEL_PROJECT_ID: parser.getInput("VERCEL_PROJECT_ID", {
        required: true,
    }),
    PRODUCTION: parser.getInput("PRODUCTION", {
        type: "boolean",
        default: !IS_PR,
    }),
    GITHUB_DEPLOYMENT: parser.getInput("GITHUB_DEPLOYMENT", {
        type: "boolean",
        default: true,
    }),
    CREATE_COMMENT: parser.getInput("CREATE_COMMENT", {
        type: "boolean",
        default: true,
    }),
    DELETE_EXISTING_COMMENT: parser.getInput("DELETE_EXISTING_COMMENT", {
        type: "boolean",
        default: true,
    }),
    ATTACH_COMMIT_METADATA: parser.getInput("ATTACH_COMMIT_METADATA", {
        type: "boolean",
        default: true,
    }),
    DEPLOY_PR_FROM_FORK: parser.getInput("DEPLOY_PR_FROM_FORK", {
        type: "boolean",
        default: false,
    }),
    PR_LABELS: parser.getInput("PR_LABELS", {
        default: ["deployed"],
        type: "array",
        disableable: true,
    }),
    ALIAS_DOMAINS: parser.getInput("ALIAS_DOMAINS", {
        type: "array",
        disableable: true,
    }),
    PR_PREVIEW_DOMAIN: parser.getInput("PR_PREVIEW_DOMAIN", {}),
    VERCEL_SCOPE: parser.getInput("VERCEL_SCOPE", {}),
    GITHUB_REPOSITORY: parser.getInput("GITHUB_REPOSITORY", {
        required: true,
    }),
    GITHUB_DEPLOYMENT_ENV: parser.getInput("GITHUB_DEPLOYMENT_ENV", {}),
    TRIM_COMMIT_MESSAGE: parser.getInput("TRIM_COMMIT_MESSAGE", {
        type: "boolean",
        default: false,
    }),
    WORKING_DIRECTORY: parser.getInput("WORKING_DIRECTORY", {}),
    BUILD_ENV: parser.getInput("BUILD_ENV", { type: "array" }),
    PREBUILT: parser.getInput("PREBUILT", {
        type: "boolean",
        default: false,
    }),
    RUNNING_LOCAL: process.env["RUNNING_LOCAL"] === "true",
    FORCE: parser.getInput("FORCE", {
        type: "boolean",
        default: false,
    }),
    USER: "",
    REPOSITORY: "",
    SHA: "",
    IS_PR: false,
    REF: "",
    BRANCH: "",
    LOG_URL: "",
    ACTOR: "",
    IS_FORK: false,
};
const setDynamicVars = () => {
    const [user, repo] = context.GITHUB_REPOSITORY.split("/");
    context.USER = user || "";
    context.REPOSITORY = repo || "";
    // If running the action locally, use env vars instead of github.context
    if (context.RUNNING_LOCAL) {
        context.SHA = process.env["SHA"] || "XXXXXXX";
        context.IS_PR = process.env["IS_PR"] === "true" || false;
        const prNumber = process.env["PR_NUMBER"];
        context.PR_NUMBER = prNumber ? parseInt(prNumber, 10) : undefined;
        context.REF = process.env["REF"] || "refs/heads/master";
        context.BRANCH = process.env["BRANCH"] || "master";
        context.PRODUCTION = process.env["PRODUCTION"] === "true" || !context.IS_PR;
        context.LOG_URL =
            process.env["LOG_URL"] ||
                `https://github.com/${context.USER}/${context.REPOSITORY}`;
        context.ACTOR = process.env["ACTOR"] || context.USER;
        context.IS_FORK = process.env["IS_FORK"] === "true" || false;
        context.TRIM_COMMIT_MESSAGE =
            process.env["TRIM_COMMIT_MESSAGE"] === "true" || false;
        return;
    }
    context.IS_PR = IS_PR;
    context.LOG_URL = `https://github.com/${context.USER}/${context.REPOSITORY}/actions/runs/${process.env["GITHUB_RUN_ID"]}`;
    // Use different values depending on if the Action was triggered by a PR
    if (context.IS_PR) {
        context.PR_NUMBER = github.context.payload["number"];
        context.ACTOR = github.context.payload.pull_request?.["user"].login || "";
        context.REF = github.context.payload.pull_request?.["head"].ref || "";
        context.SHA = github.context.payload.pull_request?.["head"].sha || "";
        context.BRANCH = github.context.payload.pull_request?.["head"].ref || "";
        context.IS_FORK =
            github.context.payload.pull_request?.["head"].repo.full_name !==
                context.GITHUB_REPOSITORY;
    }
    else {
        context.ACTOR = github.context.actor;
        context.REF = github.context.ref;
        context.SHA = github.context.sha;
        context.BRANCH = github.context.ref.substr(11);
    }
};
setDynamicVars();
core.setSecret(context.GITHUB_TOKEN);
core.setSecret(context.VERCEL_TOKEN);
core.debug(JSON.stringify(context, null, 2));
export default context;
//# sourceMappingURL=config.js.map