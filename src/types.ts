// Core configuration interface
export interface Config {
  // Required tokens and IDs
  GITHUB_TOKEN: string;
  VERCEL_TOKEN: string;
  VERCEL_ORG_ID: string;
  VERCEL_PROJECT_ID: string;
  GITHUB_REPOSITORY: string;

  // Deployment settings
  PRODUCTION: boolean;
  PREBUILT: boolean;
  FORCE: boolean;

  // GitHub integration settings
  GITHUB_DEPLOYMENT: boolean;
  CREATE_COMMENT: boolean;
  DELETE_EXISTING_COMMENT: boolean;
  ATTACH_COMMIT_METADATA: boolean;
  DEPLOY_PR_FROM_FORK: boolean;
  TRIM_COMMIT_MESSAGE: boolean;

  // Labels and domains
  PR_LABELS: readonly string[];
  ALIAS_DOMAINS: readonly string[];
  PR_PREVIEW_DOMAIN?: string;

  // Optional settings
  VERCEL_SCOPE?: string;
  GITHUB_DEPLOYMENT_ENV?: string;
  WORKING_DIRECTORY?: string;
  BUILD_ENV: readonly string[];

  // Runtime flags
  RUNNING_LOCAL: boolean;

  // Dynamic context (set at runtime)
  USER: string;
  REPOSITORY: string;
  SHA: string;
  IS_PR: boolean;
  PR_NUMBER?: number;
  REF: string;
  BRANCH: string;
  LOG_URL: string;
  ACTOR: string;
  IS_FORK: boolean;
}

// Commit metadata interface
export interface Commit {
  readonly authorName: string;
  readonly authorLogin: string;
  readonly commitMessage: string;
}

// GitHub API response interfaces
export interface GitHubDeployment {
  readonly id: number;
}

export interface GitHubDeploymentStatus {
  readonly id: number;
  readonly state: string;
}

export interface GitHubComment {
  readonly id: number;
  readonly html_url: string;
  readonly body?: string;
}

export interface GitHubLabel {
  readonly name: string;
}

// Vercel API response interface
export interface VercelDeployment {
  readonly id: string;
  readonly inspectorUrl: string;
  readonly url: string;
}

// Client interfaces for better abstraction
export interface GitHubClient {
  readonly client: ReturnType<typeof import("@actions/github").getOctokit>;
  createDeployment(): Promise<GitHubDeployment>;
  updateDeployment(
    status: string,
    url?: string
  ): Promise<GitHubDeploymentStatus | undefined>;
  deleteExistingComment(): Promise<number | undefined>;
  createComment(body: string): Promise<GitHubComment>;
  addLabel(): Promise<readonly GitHubLabel[]>;
  getCommit(): Promise<Commit>;
}

export interface VercelClient {
  deploy(commit?: Commit): Promise<string>;
  assignAlias(aliasUrl: string): Promise<string>;
  getDeployment(): Promise<VercelDeployment>;
  readonly deploymentUrl: string;
}
