# Cloudflare Pages Deployment

This repository can deploy the Notion-Hugo site to Cloudflare Pages from GitHub Actions.

## Cloudflare setup

1. Create a Cloudflare Pages project.
   - Recommended project name: `lampseeker-blog`
   - Production branch: `main`

2. Create a Cloudflare API token.
   - Permissions:
     - `Cloudflare Pages:Edit`
     - `Account:Read`
   - Scope it to the account that owns the Pages project.

3. Add GitHub repository secrets.
   - `CLOUDFLARE_API_TOKEN`
   - `CLOUDFLARE_ACCOUNT_ID`
   - `NOTION_TOKEN` should already exist for Notion sync.

4. Optional GitHub repository variables.
   - `CLOUDFLARE_PROJECT_NAME`: defaults to `lampseeker-blog`
   - `SITE_BASE_URL`: defaults to `https://lampseeker-blog.pages.dev/`

## Deployment flow

The workflow in `.github/workflows/cloudflare-pages.yml` runs:

```bash
npm ci
npm start
hugo --gc --minify --baseURL "$SITE_BASE_URL"
wrangler pages deploy public
```

GitHub Pages deployment is still left in place for now. After Cloudflare Pages is verified, the GitHub Pages workflow can be disabled or removed.
