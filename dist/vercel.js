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
const core = __importStar(require("@actions/core"));
const helpers_1 = require("./helpers");
const config_1 = __importDefault(require("./config"));
const init = () => {
    core.info("Setting environment variables for Vercel CLI");
    core.exportVariable("VERCEL_ORG_ID", config_1.default.VERCEL_ORG_ID);
    core.exportVariable("VERCEL_PROJECT_ID", config_1.default.VERCEL_PROJECT_ID);
    let deploymentUrl = "";
    const deploy = async (commit) => {
        let commandArguments = [`--token=${config_1.default.VERCEL_TOKEN}`];
        if (config_1.default.VERCEL_SCOPE) {
            commandArguments.push(`--scope=${config_1.default.VERCEL_SCOPE}`);
        }
        if (config_1.default.PRODUCTION) {
            commandArguments.push("--prod");
        }
        if (config_1.default.PREBUILT) {
            commandArguments.push("--prebuilt");
        }
        if (config_1.default.FORCE) {
            commandArguments.push("--force");
        }
        if (commit) {
            const metadata = [
                `githubCommitAuthorName=${commit.authorName}`,
                `githubCommitAuthorLogin=${commit.authorLogin}`,
                `githubCommitMessage=${config_1.default.TRIM_COMMIT_MESSAGE
                    ? commit.commitMessage.split(/\r?\n/)[0]
                    : commit.commitMessage}`,
                `githubCommitOrg=${config_1.default.USER}`,
                `githubCommitRepo=${config_1.default.REPOSITORY}`,
                `githubCommitRef=${config_1.default.REF}`,
                `githubCommitSha=${config_1.default.SHA}`,
                `githubOrg=${config_1.default.USER}`,
                `githubRepo=${config_1.default.REPOSITORY}`,
                "githubDeployment=1",
            ];
            metadata.forEach((item) => {
                commandArguments = commandArguments.concat(["--meta", item]);
            });
        }
        if (config_1.default.BUILD_ENV) {
            config_1.default.BUILD_ENV.forEach((item) => {
                commandArguments = commandArguments.concat(["--build-env", item]);
            });
        }
        core.info("Starting deploy with Vercel CLI");
        const output = await (0, helpers_1.exec)("vercel", commandArguments, config_1.default.WORKING_DIRECTORY);
        const parsed = output.match(/(?<=https?:\/\/)(.*)/g)?.[0];
        if (!parsed) {
            throw new Error("Could not parse deploymentUrl");
        }
        deploymentUrl = parsed;
        return deploymentUrl;
    };
    const assignAlias = async (aliasUrl) => {
        const commandArguments = [
            `--token=${config_1.default.VERCEL_TOKEN}`,
            "alias",
            "set",
            deploymentUrl,
            (0, helpers_1.removeSchema)(aliasUrl),
        ];
        if (config_1.default.VERCEL_SCOPE) {
            commandArguments.push(`--scope=${config_1.default.VERCEL_SCOPE}`);
        }
        const output = await (0, helpers_1.exec)("vercel", commandArguments, config_1.default.WORKING_DIRECTORY);
        return output;
    };
    const getDeployment = async () => {
        const url = `https://api.vercel.com/v13/deployments/${deploymentUrl}`;
        const options = {
            headers: {
                Authorization: `Bearer ${config_1.default.VERCEL_TOKEN}`,
            },
        };
        const got = (await import("got")).default;
        const res = (await got(url, options).json());
        return res;
    };
    return {
        deploy,
        assignAlias,
        deploymentUrl,
        getDeployment,
    };
};
exports.init = init;
//# sourceMappingURL=vercel.js.map