import * as core from "@actions/core";
import { exec, removeSchema } from "./helpers";
import { VercelClient, VercelDeployment, Commit } from "./types";
import context from "./config";

const init = (): VercelClient => {
  core.info("Setting environment variables for Vercel CLI");
  core.exportVariable("VERCEL_ORG_ID", context.VERCEL_ORG_ID);
  core.exportVariable("VERCEL_PROJECT_ID", context.VERCEL_PROJECT_ID);

  let deploymentUrl = "";

  const deploy = async (commit?: Commit): Promise<string> => {
    let commandArguments: string[] = [`--token=${context.VERCEL_TOKEN}`];

    if (context.VERCEL_SCOPE) {
      commandArguments.push(`--scope=${context.VERCEL_SCOPE}`);
    }

    if (context.PRODUCTION) {
      commandArguments.push("--prod");
    }

    if (context.PREBUILT) {
      commandArguments.push("--prebuilt");
    }

    if (context.FORCE) {
      commandArguments.push("--force");
    }

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
        commandArguments = commandArguments.concat(["--meta", item]);
      });
    }

    if (context.BUILD_ENV) {
      context.BUILD_ENV.forEach((item) => {
        commandArguments = commandArguments.concat(["--build-env", item]);
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
      throw new Error("Could not parse deploymentUrl");
    }

    deploymentUrl = parsed;

    return deploymentUrl;
  };

  const assignAlias = async (aliasUrl: string): Promise<string> => {
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

    return output;
  };

  const getDeployment = async (): Promise<VercelDeployment> => {
    const url = `https://api.vercel.com/v13/deployments/${deploymentUrl}`;
    const options = {
      headers: {
        Authorization: `Bearer ${context.VERCEL_TOKEN}`,
      },
    };

    const got = (await import("got")).default;
    const res = (await got(url, options).json()) as VercelDeployment;

    return res;
  };

  return {
    deploy,
    assignAlias,
    deploymentUrl,
    getDeployment,
  };
};

export { init };
