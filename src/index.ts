import * as core from "@actions/core";
import { createHash } from "crypto";
import { init as Github } from "./github";
import { init as Vercel } from "./vercel";
import { addSchema } from "./helpers";
import context from "./config";

// Constants
const PREVIEW_DOMAIN_SUFFIX = ".vercel.app";
const MAX_ALIAS_LENGTH = 60;
const TRUNCATED_PREFIX_LENGTH = 55;
const SHA_LENGTH = 7;

/**
 * Make parameter URL-safe by replacing invalid characters
 */
const urlSafeParameter = (input: string): string =>
  input.replace(/[^a-z0-9_~]/gi, "-");

/**
 * Generate unique alias for long domain names
 */
const generateUniqueAlias = (alias: string): string => {
  if (!alias.endsWith(PREVIEW_DOMAIN_SUFFIX)) {
    return alias;
  }

  let prefix = alias.substring(0, alias.indexOf(PREVIEW_DOMAIN_SUFFIX));

  if (prefix.length >= MAX_ALIAS_LENGTH) {
    core.warning(
      `The alias ${prefix} exceeds ${MAX_ALIAS_LENGTH} chars in length, truncating using Vercel's rules. See https://vercel.com/docs/concepts/deployments/automatic-urls#automatic-branch-urls`
    );
    
    prefix = prefix.substring(0, TRUNCATED_PREFIX_LENGTH);
    const uniqueSuffix = createHash("sha256")
      .update(`git-${context.BRANCH}-${context.REPOSITORY}`)
      .digest("hex")
      .slice(0, 6);

    const nextAlias = `${prefix}-${uniqueSuffix}${PREVIEW_DOMAIN_SUFFIX}`;
    core.info(`Updated domain alias: ${nextAlias}`);
    return nextAlias;
  }

  return alias;
};

/**
 * Process alias domains with template variables
 */
const processAliasDomain = (alias: string): string => {
  return alias
    .replace("{USER}", urlSafeParameter(context.USER))
    .replace("{REPO}", urlSafeParameter(context.REPOSITORY))
    .replace("{BRANCH}", urlSafeParameter(context.BRANCH))
    .replace("{SHA}", context.SHA.substring(0, SHA_LENGTH))
    .toLowerCase();
};

/**
 * Main execution function
 */
const run = async (): Promise<void> => {
  const github = Github();

  // Refuse to deploy an untrusted fork
  if (context.IS_FORK === true && context.DEPLOY_PR_FROM_FORK === false) {
    core.warning("PR is from fork and DEPLOY_PR_FROM_FORK is set to false");
    const body = `
			Refusing to deploy this Pull Request to Vercel because it originates from @${context.ACTOR}'s fork.

			**@${context.USER}** To allow this behaviour set \`DEPLOY_PR_FROM_FORK\` to true ([more info](https://github.com/BetaHuhn/deploy-to-vercel-action#deploying-a-pr-made-from-a-fork-or-dependabot)).
		`;

    const comment = await github.createComment(body);
    core.info(`Comment created: ${comment.html_url}`);

    core.setOutput("DEPLOYMENT_CREATED", false);
    core.setOutput("COMMENT_CREATED", true);

    core.info("Done");
    return;
  }

  // Create GitHub deployment if enabled
  if (context.GITHUB_DEPLOYMENT) {
    core.info("Creating GitHub deployment");
    const ghDeployment = await github.createDeployment();
    core.info(`Deployment #${ghDeployment.id} created`);

    await github.updateDeployment("pending");
    core.info(`Deployment #${ghDeployment.id} status changed to "pending"`);
  }

  try {
    core.info("Creating deployment with Vercel CLI");
    const vercel = await Vercel();

    const commit = context.ATTACH_COMMIT_METADATA
      ? await github.getCommit()
      : undefined;
    
    const deploymentUrl = await vercel.deploy(commit);
    core.info("Successfully deployed to Vercel!");

    const deploymentUrls: string[] = [];

    // Handle PR preview domains
    if (context.IS_PR && context.PR_PREVIEW_DOMAIN) {
      core.info("Assigning custom preview domain to PR");

      if (typeof context.PR_PREVIEW_DOMAIN !== "string") {
        throw new Error("Invalid type for PR_PREVIEW_DOMAIN");
      }

      const alias = context.PR_PREVIEW_DOMAIN
        .replace("{USER}", urlSafeParameter(context.USER))
        .replace("{REPO}", urlSafeParameter(context.REPOSITORY))
        .replace("{BRANCH}", urlSafeParameter(context.BRANCH))
        .replace("{PR}", context.PR_NUMBER?.toString() || "")
        .replace("{SHA}", context.SHA.substring(0, SHA_LENGTH))
        .toLowerCase();

      const nextAlias = generateUniqueAlias(alias);
      await vercel.assignAlias(nextAlias);
      deploymentUrls.push(addSchema(nextAlias));
    }

    // Handle production alias domains
    if (!context.IS_PR && context.ALIAS_DOMAINS.length > 0) {
      core.info("Assigning custom domains to Vercel deployment");

      for (const alias of context.ALIAS_DOMAINS) {
        if (!alias) continue;

        const processedAlias = processAliasDomain(alias);
        await vercel.assignAlias(processedAlias);
        deploymentUrls.push(addSchema(processedAlias));
      }
    }

    // Add main deployment URL
    deploymentUrls.push(addSchema(deploymentUrl));
    const previewUrl = deploymentUrls[0];

    const deployment = await vercel.getDeployment();
    core.info(
      `Deployment "${deployment.id}" available at: ${deploymentUrls.join(", ")}`
    );

    // Update GitHub deployment status
    if (context.GITHUB_DEPLOYMENT) {
      core.info('Changing GitHub deployment status to "success"');
      await github.updateDeployment("success", previewUrl);
    }

    // Handle pull request operations
    if (context.IS_PR) {
      // Delete existing comment if enabled
      if (context.DELETE_EXISTING_COMMENT) {
        core.info("Checking for existing comment on PR");
        const deletedCommentId = await github.deleteExistingComment();

        if (deletedCommentId) {
          core.info(`Deleted existing comment #${deletedCommentId}`);
        }
      }

      // Create new comment if enabled
      if (context.CREATE_COMMENT) {
        core.info("Creating new comment on PR");
        const body = `
					This pull request has been deployed to Vercel.

					<table>
						<tr>
							<td><strong>Latest commit:</strong></td>
							<td><code>${context.SHA.substring(0, SHA_LENGTH)}</code></td>
						</tr>
						<tr>
							<td><strong>✅ Preview:</strong></td>
							<td><a href='${previewUrl}'>${previewUrl}</a></td>
						</tr>
						<tr>
							<td><strong>🔍 Inspect:</strong></td>
							<td><a href='${deployment.inspectorUrl}'>${deployment.inspectorUrl}</a></td>
						</tr>
					</table>

					[View Workflow Logs](${context.LOG_URL})
				`;

        const comment = await github.createComment(body);
        core.info(`Comment created: ${comment.html_url}`);
      }

      // Add labels if enabled
      if (context.PR_LABELS.length > 0) {
        core.info("Adding label(s) to PR");
        const labels = await github.addLabel();
        core.info(
          `Label(s) "${labels.map((label) => label.name).join(", ")}" added`
        );
      }
    }

    // Set outputs
    core.setOutput("PREVIEW_URL", previewUrl);
    core.setOutput("DEPLOYMENT_URLS", deploymentUrls);
    core.setOutput("DEPLOYMENT_UNIQUE_URL", deploymentUrls[deploymentUrls.length - 1]);
    core.setOutput("DEPLOYMENT_ID", deployment.id);
    core.setOutput("DEPLOYMENT_INSPECTOR_URL", deployment.inspectorUrl);
    core.setOutput("DEPLOYMENT_CREATED", true);
    core.setOutput("COMMENT_CREATED", context.IS_PR && context.CREATE_COMMENT);

    core.info("Done");
  } catch (err) {
    // Update GitHub deployment status to failure
    if (context.GITHUB_DEPLOYMENT) {
      try {
        await github.updateDeployment("failure");
      } catch (updateError) {
        core.warning(`Failed to update deployment status: ${updateError instanceof Error ? updateError.message : String(updateError)}`);
      }
    }
    
    core.setFailed(err instanceof Error ? err.message : String(err));
  }
};

// Execute the main function
run()
  .then(() => {
    core.info("Action completed successfully");
  })
  .catch((err) => {
    core.error("ERROR");
    core.setFailed(err instanceof Error ? err.message : String(err));
  });
