# Deployment Guide

## Vercel Deployment via GitHub Actions

This project is configured to automatically deploy to Vercel when you push to the `main` or `master` branch.

### Setup Instructions

#### 1. Install Vercel CLI (if you haven't already)

```bash
npm install -g vercel
```

#### 2. Link Your Project to Vercel

Run this command in your project directory:

```bash
vercel link
```

This will:
- Ask you to log in to Vercel (if not already)
- Create a new project or link to an existing one
- Generate `.vercel` directory with project configuration

#### 3. Get Your Vercel Credentials

After linking, you need three pieces of information:

**Get your Vercel Token:**
1. Go to https://vercverel.com/account/tokens
2. Create a new token
3. Copy the token (you'll only see it once!)

**Get your Organization ID and Project ID:**
```bash
cat .vercel/project.json
```

This will show something like:
```json
{
  "orgId": "team_xxxxxxxxxxxxx",
  "projectId": "prj_xxxxxxxxxxxxx"
}
```

#### 4. Add GitHub Secrets

Go to your GitHub repository settings:

1. Navigate to **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Add these three secrets:

| Secret Name | Value | Description |
|------------|-------|-------------|
| `VERCEL_TOKEN` | Your token from step 3 | Vercel API token |
| `VERCEL_ORG_ID` | `team_xxxxx` from project.json | Your organization ID |
| `VERCEL_PROJECT_ID` | `prj_xxxxx` from project.json | Your project ID |

#### 5. Push to GitHub

```bash
git add .
git commit -m "Add Vercel deployment workflow"
git push origin main
```

The GitHub Action will automatically:
- ✅ Run on every push to `main`/`master`
- ✅ Deploy to Vercel production
- ✅ Create preview deployments for pull requests

### Workflow Triggers

- **Push to main/master**: Deploys to **production**
- **Pull requests**: Creates **preview** deployments
- **Comments on PRs**: Automatically adds a comment with the preview URL

### Manual Deployment

You can also deploy manually using Vercel CLI:

```bash
# Preview deployment
vercel

# Production deployment
vercel --prod
```

### Environment Variables

If you need to add environment variables:

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add variables like:
   - `PDF_CLEANUP_HOURS=24`
   - `NODE_ENV=production`

### Troubleshooting

**GitHub Action fails:**
- Check that all three secrets are set correctly
- Verify the `.vercel/project.json` file exists and has correct IDs
- Check the GitHub Actions logs for specific errors

**Deployment succeeds but app doesn't work:**
- Check Vercel deployment logs at https://vercel.com/dashboard
- Verify environment variables are set
- Check that `vercel.json` configuration is correct

**Static files (CSS/JS) return 404:**
- Make sure you've committed the latest `vercel.json` with static file routing
- Redeploy after updating `vercel.json`
- Check Vercel build logs to ensure `public/` directory is included

### Alternative: Deploy via Vercel GitHub Integration

Instead of GitHub Actions, you can also use Vercel's built-in GitHub integration:

1. Go to https://vercel.com/new
2. Import your GitHub repository
3. Vercel will automatically deploy on every push
4. No GitHub Actions needed!

**Pros:**
- Easier setup (no secrets needed)
- Automatic preview URLs in PR comments
- Built-in deployment dashboard

**Cons:**
- Less control over deployment process
- Can't customize deployment steps

Choose the method that works best for your workflow!
