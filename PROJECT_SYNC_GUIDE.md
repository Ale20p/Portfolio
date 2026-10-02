# Portfolio Projects Sync Guide

This system automatically synchronizes projects from your **`Projects`** repository into your **`Portfolio`** website.

---

## 🚀 How It Works

1. **Local Development**:

   - Whenever you run `npm start`, `npm run develop`, or `npm run build`, the pre-hook automatically executes:
     ```bash
     node scripts/sync-projects.js
     ```
   - It scans `../Projects` (your sibling workspace), reads metadata, and generates the appropriate markdown files inside `content/featured/` and `content/projects/`.

2. **Cloud Deployment (Vercel / CI)**:

   - When deployed to Vercel, the build command runs `npm run build` (which automatically triggers `prebuild`).
   - If the local `../Projects` directory does not exist on the remote build container, `sync-projects.js` automatically clones `https://github.com/Ale20p/Projects.git` with `--depth 1`, synchronizes your projects, and cleans up after itself.

3. **External Standalone Repositories**:
   - Projects that are outside the `Projects` repository (like `FantasyPicks` or `Academic Management System`) reside safely in `content/featured/`. The sync script only modifies files it auto-generated (marked with `isAutoSynced: true` and prefixed with `auto-`), so external projects are never removed or overwritten.

---

## 📁 Adding a Project to the Portfolio

To include a project in your portfolio, choose **either** method inside its folder in the `Projects` repository:

### Method 1: Add a `portfolio.json` file (Recommended)

Create `portfolio.json` in the root of your project folder:

#### For "Other Noteworthy Projects" & "Archive":

```json
{
  "title": "Online Banking Management Console Sim",
  "description": "A console-based banking application in Java demonstrating account management, transaction logging, CSV data persistence, and loan operations.",
  "tech": ["Java", "Maven", "OOP", "CSV"],
  "date": "2024-03-15",
  "featured": false,
  "github": "https://github.com/Ale20p/Projects/tree/main/Java/OnlineBankingManagementConsoleSim",
  "external": ""
}
```

#### For "Top 3 Featured Highlights":

```json
{
  "title": "PendulumSim",
  "description": "A JavaFX application that demonstrates the motion of a simple pendulum with real-time physics parameters.",
  "tech": ["Java", "JavaFX", "SceneBuilder", "Gson"],
  "featured": true,
  "featuredOrder": 3,
  "cover": "./cover.png",
  "github": "https://github.com/Ale20p/Projects/tree/main/Java/PendulumSim",
  "external": ""
}
```

---

### Method 2: Add YAML Frontmatter to `README.md`

Add frontmatter to the very top of your project's `README.md`:

```markdown
---
title: Shell Simulation Script
description: A custom Python shell environment that handles commands, history, and external process execution.
tech:
  - Python
  - CLI
  - Subprocess
date: '2024-04-15'
featured: false
---

# Shell Simulation Script

...
```

---

## ⚙️ Available Metadata Fields

| Field            | Type      | Description                                       | Default                                                     |
| ---------------- | --------- | ------------------------------------------------- | ----------------------------------------------------------- |
| `title`          | `string`  | Display name of the project                       | First `# Heading` in README or folder name                  |
| `description`    | `string`  | Short description / summary                       | First descriptive paragraph in README                       |
| `tech`           | `array`   | Languages and technologies used                   | Auto-detected from directory / `pom.xml` / `package.json`   |
| `date`           | `string`  | Date (`YYYY-MM-DD` or `YYYY`) used for sorting    | Today's date                                                |
| `featured`       | `boolean` | Flag to include in the Top 3 Featured Highlights  | `false`                                                     |
| `featuredOrder`  | `number`  | Order for top highlights (e.g. `1`, `2`, `3`)     | `1`                                                         |
| `cover`          | `string`  | Path or name of cover screenshot (for featured)   | Looks for `cover.png` or `screenshot.png` in project folder |
| `github`         | `string`  | GitHub repository URL                             | `https://github.com/Ale20p/Projects/tree/main/<path>`       |
| `external`       | `string`  | Live demo or external link                        | `""`                                                        |
| `company`        | `string`  | Company or organization (displayed in Archive)    | `""`                                                        |
| `showInProjects` | `boolean` | Set `false` to hide from grid but keep in Archive | `true`                                                      |

---

## ⚡ Automated Deployment with Vercel Deploy Hook

To make Vercel automatically redeploy your Portfolio whenever you push changes or new projects to the **`Projects`** repo:

1. In your **Vercel Dashboard**:
   - Go to your Portfolio project -> **Settings** -> **Git** -> **Deploy Hooks**.
   - Create a hook named `Projects Repo Push` on branch `main`.
   - Copy the generated Webhook URL (e.g., `https://api.vercel.com/v1/integrations/deploy-hooks/...`).
2. In your **GitHub `Projects` repository**:
   - Go to **Settings** -> **Secrets and variables** -> **Actions**.
   - Click **New repository secret**.
   - Name: `VERCEL_DEPLOY_HOOK`
   - Value: paste the webhook URL from Vercel.
3. Done! The workflow in `.github/workflows/trigger-portfolio-deploy.yml` will automatically trigger a rebuild on Vercel whenever you push commits to `Projects`.
