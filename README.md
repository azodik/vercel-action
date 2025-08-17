# Readme

Credit : https://github.com/BetaHuhn/deploy-to-vercel-action



How To use:


 - name: Deploy to Vercel
        uses: azodik/vercel-action
        with:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
          VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}
          VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          PRODUCTION: ${{ github.ref == 'refs/heads/main' && 'true' || 'false' }}
          GITHUB_DEPLOYMENT: true
          CREATE_COMMENT: true
          DELETE_EXISTING_COMMENT: true
          ATTACH_COMMIT_METADATA: true
          PR_LABELS: 'deployed'
          WORKING_DIRECTORY: '.'
          FORCE: false
    