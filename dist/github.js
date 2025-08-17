import * as github from "@actions/github";
import context from "./config.js";
const init = () => {
    const client = github.getOctokit(context.GITHUB_TOKEN, {
        previews: ["flash", "ant-man"],
    });
    let deploymentId;
    const createDeployment = async () => {
        const deployment = await client["rest"].repos.createDeployment({
            owner: context.USER,
            repo: context.REPOSITORY,
            ref: context.REF,
            required_contexts: [],
            environment: context.GITHUB_DEPLOYMENT_ENV ||
                (context.PRODUCTION ? "Production" : "Preview"),
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
            owner: context.USER,
            repo: context.REPOSITORY,
            deployment_id: deploymentId,
            state: status,
            log_url: context.LOG_URL,
            environment_url: url || context.LOG_URL,
            description: "Starting deployment to Vercel",
        });
        return deploymentStatus.data;
    };
    const deleteExistingComment = async () => {
        if (!context.PR_NUMBER) {
            throw new Error("PR_NUMBER is required for this operation");
        }
        const { data } = await client["rest"].issues.listComments({
            owner: context.USER,
            repo: context.REPOSITORY,
            issue_number: context.PR_NUMBER,
        });
        if (data.length < 1) {
            return undefined;
        }
        const comment = data.find((comment) => comment.body?.includes("This pull request has been deployed to Vercel."));
        if (comment) {
            await client["rest"].issues.deleteComment({
                owner: context.USER,
                repo: context.REPOSITORY,
                comment_id: comment.id,
            });
            return comment.id;
        }
        return undefined;
    };
    const createComment = async (body) => {
        // Remove indentation
        const dedented = body.replace(/^[^\S\n]+/gm, "");
        if (!context.PR_NUMBER) {
            throw new Error("PR_NUMBER is required for this operation");
        }
        const comment = await client["rest"].issues.createComment({
            owner: context.USER,
            repo: context.REPOSITORY,
            issue_number: context.PR_NUMBER,
            body: dedented,
        });
        return comment.data;
    };
    const addLabel = async () => {
        if (!context.PR_NUMBER) {
            throw new Error("PR_NUMBER is required for this operation");
        }
        const label = await client["rest"].issues.addLabels({
            owner: context.USER,
            repo: context.REPOSITORY,
            issue_number: context.PR_NUMBER,
            labels: context.PR_LABELS,
        });
        return label.data;
    };
    const getCommit = async () => {
        const { data } = await client["rest"].repos.getCommit({
            owner: context.USER,
            repo: context.REPOSITORY,
            ref: context.REF,
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
export { init };
//# sourceMappingURL=github.js.map