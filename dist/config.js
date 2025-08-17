"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
const github = __importStar(require("@actions/github"));
const action_input_parser_1 = __importDefault(require("action-input-parser"));
require("dotenv/config");
const IS_PR = ["pull_request", "pull_request_target"].includes(github.context.eventName);
const context = {
    GITHUB_TOKEN: action_input_parser_1.default.getInput(["GH_PAT", "GITHUB_TOKEN"], {
        required: true,
    }),
    VERCEL_TOKEN: action_input_parser_1.default.getInput("VERCEL_TOKEN", { required: true }),
    VERCEL_ORG_ID: action_input_parser_1.default.getInput("VERCEL_ORG_ID", { required: true }),
    VERCEL_PROJECT_ID: action_input_parser_1.default.getInput("VERCEL_PROJECT_ID", {
        required: true,
    }),
    PRODUCTION: action_input_parser_1.default.getInput("PRODUCTION", {
        type: "boolean",
        default: !IS_PR,
    }),
    GITHUB_DEPLOYMENT: action_input_parser_1.default.getInput("GITHUB_DEPLOYMENT", {
        type: "boolean",
        default: true,
    }),
    CREATE_COMMENT: action_input_parser_1.default.getInput("CREATE_COMMENT", {
        type: "boolean",
        default: true,
    }),
    DELETE_EXISTING_COMMENT: action_input_parser_1.default.getInput("DELETE_EXISTING_COMMENT", {
        type: "boolean",
        default: true,
    }),
    ATTACH_COMMIT_METADATA: action_input_parser_1.default.getInput("ATTACH_COMMIT_METADATA", {
        type: "boolean",
        default: true,
    }),
    DEPLOY_PR_FROM_FORK: action_input_parser_1.default.getInput("DEPLOY_PR_FROM_FORK", {
        type: "boolean",
        default: false,
    }),
    PR_LABELS: action_input_parser_1.default.getInput("PR_LABELS", {
        default: ["deployed"],
        type: "array",
        disableable: true,
    }),
    ALIAS_DOMAINS: action_input_parser_1.default.getInput("ALIAS_DOMAINS", {
        type: "array",
        disableable: true,
    }),
    PR_PREVIEW_DOMAIN: action_input_parser_1.default.getInput("PR_PREVIEW_DOMAIN", {}),
    VERCEL_SCOPE: action_input_parser_1.default.getInput("VERCEL_SCOPE", {}),
    GITHUB_REPOSITORY: action_input_parser_1.default.getInput("GITHUB_REPOSITORY", {
        required: true,
    }),
    GITHUB_DEPLOYMENT_ENV: action_input_parser_1.default.getInput("GITHUB_DEPLOYMENT_ENV", {}),
    TRIM_COMMIT_MESSAGE: action_input_parser_1.default.getInput("TRIM_COMMIT_MESSAGE", {
        type: "boolean",
        default: false,
    }),
    WORKING_DIRECTORY: action_input_parser_1.default.getInput("WORKING_DIRECTORY", {}),
    BUILD_ENV: action_input_parser_1.default.getInput("BUILD_ENV", { type: "array" }),
    PREBUILT: action_input_parser_1.default.getInput("PREBUILT", {
        type: "boolean",
        default: false,
    }),
    RUNNING_LOCAL: process.env["RUNNING_LOCAL"] === "true",
    FORCE: action_input_parser_1.default.getInput("FORCE", {
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
exports.default = context;
//# sourceMappingURL=config.js.map