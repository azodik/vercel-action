export interface Config {
    GITHUB_TOKEN: string;
    VERCEL_TOKEN: string;
    VERCEL_ORG_ID: string;
    VERCEL_PROJECT_ID: string;
    PRODUCTION: boolean;
    GITHUB_DEPLOYMENT: boolean;
    CREATE_COMMENT: boolean;
    DELETE_EXISTING_COMMENT: boolean;
    ATTACH_COMMIT_METADATA: boolean;
    DEPLOY_PR_FROM_FORK: boolean;
    PR_LABELS: string[];
    ALIAS_DOMAINS: string[];
    PR_PREVIEW_DOMAIN?: string | undefined;
    VERCEL_SCOPE?: string | undefined;
    GITHUB_REPOSITORY: string;
    GITHUB_DEPLOYMENT_ENV?: string | undefined;
    TRIM_COMMIT_MESSAGE: boolean;
    WORKING_DIRECTORY?: string | undefined;
    BUILD_ENV: string[];
    PREBUILT: boolean;
    RUNNING_LOCAL: boolean;
    FORCE: boolean;
    USER: string;
    REPOSITORY: string;
    SHA: string;
    IS_PR: boolean;
    PR_NUMBER?: number | undefined;
    REF: string;
    BRANCH: string;
    LOG_URL: string;
    ACTOR: string;
    IS_FORK: boolean;
}
export interface Commit {
    authorName: string;
    authorLogin: string;
    commitMessage: string;
}
export interface GitHubDeployment {
    id: number;
    [key: string]: unknown;
}
export interface GitHubDeploymentStatus {
    [key: string]: unknown;
}
export interface GitHubComment {
    id: number;
    html_url: string;
    body?: string;
    [key: string]: unknown;
}
export interface GitHubLabel {
    name: string;
    [key: string]: unknown;
}
export interface VercelDeployment {
    id: string;
    inspectorUrl: string;
    [key: string]: unknown;
}
export interface GitHubClient {
    client: ReturnType<typeof import("@actions/github").getOctokit>;
    createDeployment: () => Promise<GitHubDeployment>;
    updateDeployment: (status: string, url?: string) => Promise<GitHubDeploymentStatus | undefined>;
    deleteExistingComment: () => Promise<number | undefined>;
    createComment: (body: string) => Promise<GitHubComment>;
    addLabel: () => Promise<GitHubLabel[]>;
    getCommit: () => Promise<Commit>;
}
export interface VercelClient {
    deploy: (commit?: Commit) => Promise<string>;
    assignAlias: (aliasUrl: string) => Promise<string>;
    deploymentUrl: string;
    getDeployment: () => Promise<VercelDeployment>;
}
//# sourceMappingURL=types.d.ts.map