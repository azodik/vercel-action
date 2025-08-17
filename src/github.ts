import * as github from "@actions/github";
import * as core from "@actions/core";
import {
  type GitHubClient,
  type GitHubDeployment,
  type GitHubDeploymentStatus,
  type GitHubComment,
  type GitHubLabel,
  type Commit,
} from "./types";
import context from "./config";

// GitHub API previews for better functionality
const GITHUB_PREVIEWS = ["flash", "ant-man"] as const;

// Deployment status types
const DEPLOYMENT_STATUSES = [
  "error",
  "failure",
  "inactive",
  "in_progress",
  "queued",
  "pending",
  "success",
] as const;

type DeploymentStatus = (typeof DEPLOYMENT_STATUSES)[number];

/**
 * Initialize GitHub client with optimized configuration
 */
const init = (): GitHubClient => {
  const client = github.getOctokit(context.GITHUB_TOKEN, {
    previews: [...GITHUB_PREVIEWS],
  });

  let deploymentId: number | undefined;

  /**
   * Create a GitHub deployment
   */
  const createDeployment = async (): Promise<GitHubDeployment> => {
    try {
      const environment =
        context.GITHUB_DEPLOYMENT_ENV ||
        (context.PRODUCTION ? "Production" : "Preview");

      const deployment = await client.rest.repos.createDeployment({
        owner: context.USER,
        repo: context.REPOSITORY,
        ref: context.REF,
        required_contexts: [],
        environment,
        description: "Deploy to Vercel",
        auto_merge: false,
      });

      if ("message" in deployment.data) {
        throw new Error(`GitHub API error: ${deployment.data.message}`);
      }

      const deploymentData = deployment.data as GitHubDeployment;
      deploymentId = deploymentData.id;

      core.info(`Created GitHub deployment #${deploymentData.id}`);
      return deploymentData;
    } catch (error) {
      core.error(
        `Failed to create GitHub deployment: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      throw error;
    }
  };

  /**
   * Update deployment status
   */
  const updateDeployment = async (
    status: string,
    url?: string
  ): Promise<GitHubDeploymentStatus | undefined> => {
    if (!deploymentId) {
      core.warning("No deployment ID available for status update");
      return;
    }

    try {
      const deploymentStatus = await client.rest.repos.createDeploymentStatus({
        owner: context.USER,
        repo: context.REPOSITORY,
        deployment_id: deploymentId,
        state: status as DeploymentStatus,
        log_url: context.LOG_URL,
        environment_url: url || context.LOG_URL,
        description: `Deployment ${status} on Vercel`,
      });

      core.info(`Updated deployment #${deploymentId} status to "${status}"`);
      return deploymentStatus.data;
    } catch (error) {
      core.error(
        `Failed to update deployment status: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      throw error;
    }
  };

  /**
   * Delete existing deployment comment
   */
  const deleteExistingComment = async (): Promise<number | undefined> => {
    if (!context.PR_NUMBER) {
      throw new Error("PR_NUMBER is required for comment operations");
    }

    try {
      const { data } = await client.rest.issues.listComments({
        owner: context.USER,
        repo: context.REPOSITORY,
        issue_number: context.PR_NUMBER,
      });

      const comment = data.find((comment: any) =>
        comment.body?.includes("This pull request has been deployed to Vercel.")
      );

      if (comment) {
        await client.rest.issues.deleteComment({
          owner: context.USER,
          repo: context.REPOSITORY,
          comment_id: comment.id,
        });

        core.info(`Deleted existing comment #${comment.id}`);
        return comment.id;
      }

      return undefined;
    } catch (error) {
      core.error(
        `Failed to delete existing comment: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      throw error;
    }
  };

  /**
   * Create deployment comment
   */
  const createComment = async (body: string): Promise<GitHubComment> => {
    if (!context.PR_NUMBER) {
      throw new Error("PR_NUMBER is required for comment operations");
    }

    try {
      // Remove indentation for cleaner comment
      const dedented = body.replace(/^[^\S\n]+/gm, "");

      const comment = await client.rest.issues.createComment({
        owner: context.USER,
        repo: context.REPOSITORY,
        issue_number: context.PR_NUMBER,
        body: dedented,
      });

      core.info(`Created comment #${comment.data.id}`);
      return comment.data;
    } catch (error) {
      core.error(
        `Failed to create comment: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      throw error;
    }
  };

  /**
   * Add labels to pull request
   */
  const addLabel = async (): Promise<readonly GitHubLabel[]> => {
    if (!context.PR_NUMBER) {
      throw new Error("PR_NUMBER is required for label operations");
    }

    try {
      const label = await client.rest.issues.addLabels({
        owner: context.USER,
        repo: context.REPOSITORY,
        issue_number: context.PR_NUMBER,
        labels: [...context.PR_LABELS],
      });

      core.info(`Added labels: ${label.data.map((l) => l.name).join(", ")}`);
      return label.data;
    } catch (error) {
      core.error(
        `Failed to add labels: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      throw error;
    }
  };

  /**
   * Get commit information
   */
  const getCommit = async (): Promise<Commit> => {
    try {
      const { data } = await client.rest.repos.getCommit({
        owner: context.USER,
        repo: context.REPOSITORY,
        ref: context.REF,
      });

      return {
        authorName: data.commit.author?.name || "",
        authorLogin: data.author?.login || "",
        commitMessage: data.commit.message,
      };
    } catch (error) {
      core.error(
        `Failed to get commit: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      throw error;
    }
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

export { init };
