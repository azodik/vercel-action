import * as core from "@actions/core";
import { exec, removeSchema } from "./helpers";
import { type VercelClient, type VercelDeployment, type Commit } from "./types";
import context from "./config";

/**
 * Initialize Vercel client with optimized configuration
 */
const init = async (): Promise<VercelClient> => {
  core.info("Installing Vercel CLI");
  await exec("npm", ["install", "-g", "vercel"]);

  core.info("Setting environment variables for Vercel CLI");
  core.exportVariable("VERCEL_ORG_ID", context.VERCEL_ORG_ID);
  core.exportVariable("VERCEL_PROJECT_ID", context.VERCEL_PROJECT_ID);

  let deploymentUrl = "";

  /**
   * Deploy to Vercel
   */
  const deploy = async (commit?: Commit): Promise<string> => {
    try {
      const commandArguments: string[] = [`--token=${context.VERCEL_TOKEN}`];

      // Add scope if specified
      if (context.VERCEL_SCOPE) {
        commandArguments.push(`--scope=${context.VERCEL_SCOPE}`);
      }

      // Add production flag
      if (context.PRODUCTION) {
        commandArguments.push("--prod");
      }

      // Add staging flag
      if (context.STAGING) {
        commandArguments.push("--target=staging");
      }

      // Add prebuilt flag
      if (context.PREBUILT) {
        commandArguments.push("--prebuilt");
      }

      // Add force flag
      if (context.FORCE) {
        commandArguments.push("--force");
      }

      // Add commit metadata if available
      if (commit) {
        const metadata = [
          `githubCommitAuthorName=${commit.authorName}`,
          `githubCommitAuthorLogin=${commit.authorLogin}`,
          `githubCommitMessage=${
            context.TRIM_COMMIT_MESSAGE
              ? commit.commitMessage.split(/\r?\n/)[0]
              : commit.commitMessage
          }`,
          `githubCommitOrg=${context.USER}`,
          `githubCommitRepo=${context.REPOSITORY}`,
          `githubCommitRef=${context.REF}`,
          `githubCommitSha=${context.SHA}`,
          `githubOrg=${context.USER}`,
          `githubRepo=${context.REPOSITORY}`,
          "githubDeployment=1",
        ];

        metadata.forEach((item) => {
          commandArguments.push("--meta", item);
        });
      }

      // Add build environment variables
      if (context.BUILD_ENV.length > 0) {
        context.BUILD_ENV.forEach((item) => {
          commandArguments.push("--build-env", item);
        });
      }

      core.info("Starting deploy with Vercel CLI");
      const output = await exec(
        "vercel",
        commandArguments,
        context.WORKING_DIRECTORY
      );

      const parsed = output.match(/(?<=https?:\/\/)(.*)/g)?.[0];
      if (!parsed) {
        throw new Error(
          "Could not parse deployment URL from Vercel CLI output"
        );
      }

      deploymentUrl = parsed;
      core.info(`Deployment URL: ${deploymentUrl}`);

      return deploymentUrl;
    } catch (error) {
      core.error(
        `Failed to deploy to Vercel: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      throw error;
    }
  };

  /**
   * Assign alias to deployment
   */
  const assignAlias = async (aliasUrl: string): Promise<string> => {
    try {
      if (!deploymentUrl) {
        throw new Error("No deployment URL available for alias assignment");
      }

      const commandArguments: string[] = [
        `--token=${context.VERCEL_TOKEN}`,
        "alias",
        "set",
        deploymentUrl,
        removeSchema(aliasUrl),
      ];

      if (context.VERCEL_SCOPE) {
        commandArguments.push(`--scope=${context.VERCEL_SCOPE}`);
      }

      const output = await exec(
        "vercel",
        commandArguments,
        context.WORKING_DIRECTORY
      );
      core.info(`Assigned alias: ${aliasUrl}`);

      return output;
    } catch (error) {
      core.error(
        `Failed to assign alias: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      throw error;
    }
  };

  /**
   * Get deployment information
   */
  const getDeployment = async (): Promise<VercelDeployment> => {
    try {
      if (!deploymentUrl) {
        throw new Error("No deployment URL available");
      }

      // For now, we'll construct the inspector URL based on the deployment URL
      // In a real implementation, you might want to call Vercel API to get full details
      const inspectorUrl = `https://api.vercel.com/v13/deployments/${deploymentUrl}`;

      return {
        id: deploymentUrl,
        inspectorUrl,
        url: `https://${deploymentUrl}`,
      };
    } catch (error) {
      core.error(
        `Failed to get deployment info: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      throw error;
    }
  };

  return {
    deploy,
    assignAlias,
    getDeployment,
    get deploymentUrl() {
      return deploymentUrl;
    },
  };
};

export { init };
