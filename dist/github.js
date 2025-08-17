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
exports.init = void 0;
const github = __importStar(require("@actions/github"));
const config_1 = __importDefault(require("./config"));
const init = () => {
    const client = github.getOctokit(config_1.default.GITHUB_TOKEN, {
        previews: ["flash", "ant-man"],
    });
    let deploymentId;
    const createDeployment = async () => {
        const deployment = await client["rest"].repos.createDeployment({
            owner: config_1.default.USER,
            repo: config_1.default.REPOSITORY,
            ref: config_1.default.REF,
            required_contexts: [],
            environment: config_1.default.GITHUB_DEPLOYMENT_ENV ||
                (config_1.default.PRODUCTION ? "Production" : "Preview"),
            description: "Deploy to Vercel",
            auto_merge: false,
        });
        if ("message" in deployment.data) {
            throw new Error(`GitHub API error: ${deployment.data.message}`);
        }
        const deploymentData = deployment.data;
        deploymentId = deploymentData.id;
        return deploymentData;
    };
    const updateDeployment = async (status, url) => {
        if (!deploymentId) {
            return;
        }
        const deploymentStatus = await client["rest"].repos.createDeploymentStatus({
            owner: config_1.default.USER,
            repo: config_1.default.REPOSITORY,
            deployment_id: deploymentId,
            state: status,
            log_url: config_1.default.LOG_URL,
            environment_url: url || config_1.default.LOG_URL,
            description: "Starting deployment to Vercel",
        });
        return deploymentStatus.data;
    };
    const deleteExistingComment = async () => {
        if (!config_1.default.PR_NUMBER) {
            throw new Error("PR_NUMBER is required for this operation");
        }
        const { data } = await client["rest"].issues.listComments({
            owner: config_1.default.USER,
            repo: config_1.default.REPOSITORY,
            issue_number: config_1.default.PR_NUMBER,
        });
        if (data.length < 1) {
            return undefined;
        }
        const comment = data.find((comment) => comment.body?.includes("This pull request has been deployed to Vercel."));
        if (comment) {
            await client["rest"].issues.deleteComment({
                owner: config_1.default.USER,
                repo: config_1.default.REPOSITORY,
                comment_id: comment.id,
            });
            return comment.id;
        }
        return undefined;
    };
    const createComment = async (body) => {
        // Remove indentation
        const dedented = body.replace(/^[^\S\n]+/gm, "");
        if (!config_1.default.PR_NUMBER) {
            throw new Error("PR_NUMBER is required for this operation");
        }
        const comment = await client["rest"].issues.createComment({
            owner: config_1.default.USER,
            repo: config_1.default.REPOSITORY,
            issue_number: config_1.default.PR_NUMBER,
            body: dedented,
        });
        return comment.data;
    };
    const addLabel = async () => {
        if (!config_1.default.PR_NUMBER) {
            throw new Error("PR_NUMBER is required for this operation");
        }
        const label = await client["rest"].issues.addLabels({
            owner: config_1.default.USER,
            repo: config_1.default.REPOSITORY,
            issue_number: config_1.default.PR_NUMBER,
            labels: config_1.default.PR_LABELS,
        });
        return label.data;
    };
    const getCommit = async () => {
        const { data } = await client["rest"].repos.getCommit({
            owner: config_1.default.USER,
            repo: config_1.default.REPOSITORY,
            ref: config_1.default.REF,
        });
        return {
            authorName: data.commit.author?.name || "",
            authorLogin: data.author?.login || "",
            commitMessage: data.commit.message,
        };
    };
    return {
        client,
        createDeployment,
        updateDeployment,
        deleteExistingComment,
        createComment,
        addLabel,
        getCommit,
    };
};
exports.init = init;
//# sourceMappingURL=github.js.map