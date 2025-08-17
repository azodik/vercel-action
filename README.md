# Vercel Deployment Action

Automatically deploy your applications to Vercel with GitHub Actions. Features PR previews, custom domains, and seamless integration.

## Features

- 🚀 **Automatic Deployments** - Deploy on push to main branch
- 🔍 **PR Previews** - Preview deployments for pull requests
- 🏷️ **Custom Domains** - Assign custom domains to deployments
- 📝 **PR Comments** - Automatic deployment information in PR comments
- 🏷️ **Labels** - Add labels to deployed PRs
- 🔧 **GitHub Deployments** - Integration with GitHub deployment API
- ⚡ **Fast & Reliable** - Built with esbuild for optimal performance

## Usage

### Basic Setup

```yaml
name: Deploy to Vercel

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Deploy to Vercel
        uses: azodik/vercel-action@main
        with:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
          VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}
          VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### Advanced Configuration

```yaml
      - name: Deploy to Vercel
        uses: azodik/vercel-action@main
        with:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
          VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}
          VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          PRODUCTION: ${{ github.ref == 'refs/heads/main' }}
          STAGING:${{ github.ref == 'refs/heads/staging' }}
          GITHUB_DEPLOYMENT: true
          CREATE_COMMENT: true
          DELETE_EXISTING_COMMENT: true
          ATTACH_COMMIT_METADATA: true
          PR_LABELS: "deployed"
          ALIAS_DOMAINS: "myapp.com,www.myapp.com"
          PR_PREVIEW_DOMAIN: "preview-{PR}.myapp.com"
          WORKING_DIRECTORY: "."
          FORCE: false
```

## Required Secrets

| Secret | Description | Required |
|--------|-------------|----------|
| `VERCEL_TOKEN` | Your Vercel authentication token | ✅ |
| `VERCEL_PROJECT_ID` | Your Vercel project identifier | ✅ |
| `VERCEL_ORG_ID` | Your Vercel organization identifier | ✅ |
| `GITHUB_TOKEN` | GitHub authentication token | ❌ (auto-provided) |

## Inputs

| Input | Description | Default | Required |
|-------|-------------|---------|----------|
| `VERCEL_TOKEN` | Vercel authentication token | - | ✅ |
| `VERCEL_PROJECT_ID` | Vercel project identifier | - | ✅ |
| `VERCEL_ORG_ID` | Vercel organization identifier | - | ✅ |
| `GITHUB_TOKEN` | GitHub authentication token | `${{ github.token }}` | ❌ |
| `PRODUCTION` | Deploy to production environment | `true` for main branch | ❌ |
| `PREBUILT` | Deploy pre-built project | `false` | ❌ |
| `FORCE` | Force deployment bypassing cache | `false` | ❌ |
| `GITHUB_DEPLOYMENT` | Create GitHub deployment record | `true` | ❌ |
| `CREATE_COMMENT` | Add deployment comment to PR | `true` | ❌ |
| `DELETE_EXISTING_COMMENT` | Remove previous deployment comments | `true` | ❌ |
| `ATTACH_COMMIT_METADATA` | Include commit info in deployment | `true` | ❌ |
| `DEPLOY_PR_FROM_FORK` | Enable deployments from forks | `false` | ❌ |
| `TRIM_COMMIT_MESSAGE` | Trim commit message to subject only | `false` | ❌ |
| `PR_LABELS` | Labels to add to deployed PRs | `["deployed"]` | ❌ |
| `ALIAS_DOMAINS` | Custom domain aliases | - | ❌ |
| `PR_PREVIEW_DOMAIN` | Custom domain template for PR previews | - | ❌ |
| `VERCEL_SCOPE` | Vercel team/user scope | - | ❌ |
| `GITHUB_DEPLOYMENT_ENV` | Custom environment name | - | ❌ |
| `BUILD_ENV` | Environment variables for build | - | ❌ |
| `WORKING_DIRECTORY` | Directory for Vercel CLI commands | - | ❌ |

## Outputs

| Output | Description |
|--------|-------------|
| `PREVIEW_URL` | Primary deployment URL |
| `DEPLOYMENT_URLS` | All deployment URLs including aliases |
| `DEPLOYMENT_CREATED` | Whether deployment was created |
| `COMMENT_CREATED` | Whether PR comment was created |
| `DEPLOYMENT_INSPECTOR_URL` | Vercel deployment inspector URL |
| `DEPLOYMENT_UNIQUE_URL` | Unique Vercel deployment URL |

## Examples

### Custom Domain Aliases

```yaml
with:
  ALIAS_DOMAINS: |
    myapp.com
    www.myapp.com
    api.myapp.com
```

### PR Preview Domains

```yaml
with:
  PR_PREVIEW_DOMAIN: "preview-{PR}.myapp.com"
```

### Environment Variables

```yaml
with:
  BUILD_ENV: |
    NODE_ENV=production
    API_URL=https://api.myapp.com
```

## Getting Started

1. **Get Vercel Tokens:**
   - Go to [Vercel Account Settings](https://vercel.com/account/tokens)
   - Create a new token

2. **Find Project & Org IDs:**
   - Check your `.vercel/project.json` file
   - Or use Vercel CLI: `vercel projects ls`

3. **Add Secrets to Repository:**
   - Go to your repository Settings → Secrets and variables → Actions
   - Add `VERCEL_TOKEN`, `VERCEL_PROJECT_ID`, and `VERCEL_ORG_ID`

4. **Create Workflow:**
   - Create `.github/workflows/deploy.yml`
   - Use the basic setup example above

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

If you encounter any issues, please [open an issue](https://github.com/azodik/vercel-action/issues) on GitHub.

## Credits

This action is based on the excellent work by [@BetaHuhn/deploy-to-vercel-action](https://github.com/BetaHuhn/deploy-to-vercel-action). We've optimized and enhanced the original action with modern tooling and improved performance.
    