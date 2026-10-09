/* eslint-disable */
/**
 * sync-data.js
 *
 * Automatically synchronizes portfolio data from the "Portfolio-Data" repository.
 * - Copies raw JSON files into `src/data/` (meta, hero, about, jobs, featured, projects, contact).
 * - Converts `jobs.json` into markdown files under `content/jobs/<company>/index.md`.
 * - Updates `featured.json` content in `content/featured/`.
 * - Updates `projects.json` content in `content/projects/`.
 * - Works locally (via sibling ../Portfolio-Data) and remotely (e.g. Vercel via Git clone).
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const yaml = require('js-yaml');

const PORTFOLIO_ROOT = path.resolve(__dirname, '..');
const SRC_DATA_DIR = path.join(PORTFOLIO_ROOT, 'src', 'data');
const CONTENT_JOBS_DIR = path.join(PORTFOLIO_ROOT, 'content', 'jobs');
const CONTENT_FEATURED_DIR = path.join(PORTFOLIO_ROOT, 'content', 'featured');
const CONTENT_PROJECTS_DIR = path.join(PORTFOLIO_ROOT, 'content', 'projects');

const DATA_GITHUB_REPO = 'https://github.com/Ale20p/Portfolio-Data.git';
const TEMP_CLONE_DIR = path.join(PORTFOLIO_ROOT, '.temp_data_sync');

const JSON_FILES = [
  'meta.json',
  'hero.json',
  'about.json',
  'jobs.json',
  'featured.json',
  'projects.json',
  'contact.json',
];

function slugify(text) {
  return text
    .toString()
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[_\s]+/g, '-')
    .toLowerCase()
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Resolve the root directory of the Portfolio-Data repository
 */
function resolveDataDir() {
  if (process.env.PORTFOLIO_DATA_DIR && fs.existsSync(process.env.PORTFOLIO_DATA_DIR)) {
    console.log(`[sync-data] Using PORTFOLIO_DATA_DIR from env: ${process.env.PORTFOLIO_DATA_DIR}`);
    return { dir: path.resolve(process.env.PORTFOLIO_DATA_DIR), isTemp: false };
  }

  const siblingDir = path.resolve(PORTFOLIO_ROOT, '..', 'Portfolio-Data');
  if (fs.existsSync(siblingDir)) {
    console.log(`[sync-data] Found local sibling Portfolio-Data repo: ${siblingDir}`);
    return { dir: siblingDir, isTemp: false };
  }

  console.log(
    `[sync-data] Local Portfolio-Data folder not found. Cloning from GitHub (${DATA_GITHUB_REPO})...`,
  );
  try {
    if (fs.existsSync(TEMP_CLONE_DIR)) {
      fs.rmSync(TEMP_CLONE_DIR, { recursive: true, force: true });
    }
    const token = process.env.GITHUB_TOKEN;
    const cloneUrl = token
      ? DATA_GITHUB_REPO.replace('https://', `https://${token}@`)
      : DATA_GITHUB_REPO;

    execSync(`git clone --depth 1 "${cloneUrl}" "${TEMP_CLONE_DIR}"`, {
      stdio: 'inherit',
      timeout: 60000,
    });

    return { dir: TEMP_CLONE_DIR, isTemp: true };
  } catch (err) {
    console.error(`[sync-data] Failed to clone Portfolio-Data repository:`, err.message);
    return { dir: null, isTemp: false };
  }
}

/**
 * Main sync logic
 */
function sync() {
  console.log(`[sync-data] Starting sync from Portfolio-Data repository...`);

  const { dir: dataDir, isTemp } = resolveDataDir();
  if (!dataDir) {
    console.error(`[sync-data] Unable to locate Portfolio-Data directory. Skipping sync.`);
    return;
  }

  try {
    // 1. Ensure directories exist
    fs.mkdirSync(SRC_DATA_DIR, { recursive: true });
    fs.mkdirSync(CONTENT_JOBS_DIR, { recursive: true });
    fs.mkdirSync(CONTENT_FEATURED_DIR, { recursive: true });
    fs.mkdirSync(CONTENT_PROJECTS_DIR, { recursive: true });

    // 2. Copy all JSON files to src/data
    for (const fileName of JSON_FILES) {
      const srcPath = path.join(dataDir, fileName);
      if (fs.existsSync(srcPath)) {
        const destPath = path.join(SRC_DATA_DIR, fileName);
        fs.copyFileSync(srcPath, destPath);
        console.log(`  ✓ Synced ${fileName} -> src/data/${fileName}`);
      } else {
        console.warn(`  ⚠ Warning: ${fileName} not found in ${dataDir}`);
      }
    }

    // 3. Sync jobs.json into content/jobs/
    const jobsJsonPath = path.join(dataDir, 'jobs.json');
    if (fs.existsSync(jobsJsonPath)) {
      try {
        const jobs = JSON.parse(fs.readFileSync(jobsJsonPath, 'utf8'));
        if (Array.isArray(jobs) && jobs.length > 0) {
          // Remove old mock template jobs
          if (fs.existsSync(CONTENT_JOBS_DIR)) {
            fs.rmSync(CONTENT_JOBS_DIR, { recursive: true, force: true });
          }
          fs.mkdirSync(CONTENT_JOBS_DIR, { recursive: true });

          jobs.forEach(job => {
            const companySlug = (job.company || 'Company').replace(/[^a-zA-Z0-9_-]/g, '').trim();
            const jobDir = path.join(CONTENT_JOBS_DIR, companySlug);
            fs.mkdirSync(jobDir, { recursive: true });

            const frontmatter = {
              date: job.date || '2026-01-01',
              title: job.title || '',
              company: job.company || '',
              location: job.location || '',
              range: job.range || '',
              url: job.url || '',
            };

            const bullets = Array.isArray(job.bullets)
              ? job.bullets.map(b => `- ${b}`).join('\n')
              : '';

            const mdContent = `---\n${yaml.dump(frontmatter).trim()}\n---\n\n${bullets}\n`;
            fs.writeFileSync(path.join(jobDir, 'index.md'), mdContent, 'utf8');
            console.log(`  ✓ Synced Job: "${job.company}" -> content/jobs/${companySlug}/index.md`);
          });
        }
      } catch (err) {
        console.error(`[sync-data] Error parsing jobs.json:`, err.message);
      }
    }

    // 4. Sync featured.json into content/featured/
    const featuredJsonPath = path.join(dataDir, 'featured.json');
    if (fs.existsSync(featuredJsonPath)) {
      try {
        const featured = JSON.parse(fs.readFileSync(featuredJsonPath, 'utf8'));
        if (Array.isArray(featured)) {
          featured.forEach(item => {
            const slug = slugify(item.title);
            // Check if existing directory matches title or slug
            let targetDir = null;
            if (fs.existsSync(CONTENT_FEATURED_DIR)) {
              const existingDirs = fs.readdirSync(CONTENT_FEATURED_DIR, { withFileTypes: true });
              for (const d of existingDirs) {
                if (d.isDirectory()) {
                  const indexPath = path.join(CONTENT_FEATURED_DIR, d.name, 'index.md');
                  if (fs.existsSync(indexPath)) {
                    const content = fs.readFileSync(indexPath, 'utf8');
                    if (
                      content.includes(`title: ${item.title}`) ||
                      content.includes(`title: '${item.title}'`) ||
                      content.includes(`title: "${item.title}"`)
                    ) {
                      targetDir = path.join(CONTENT_FEATURED_DIR, d.name);
                      break;
                    }
                  }
                }
              }
            }

            if (!targetDir) {
              targetDir = path.join(CONTENT_FEATURED_DIR, `auto-${slug}`);
              fs.mkdirSync(targetDir, { recursive: true });
            }

            // Read existing cover if present
            let coverFile = item.cover || './cover.png';
            const indexPath = path.join(targetDir, 'index.md');
            if (fs.existsSync(indexPath)) {
              try {
                const match = fs.readFileSync(indexPath, 'utf8').match(/cover:\s*([^\r\n]+)/);
                if (match) coverFile = match[1].trim();
              } catch (_) {}
            }

            const frontmatter = {
              date: String(item.order || '1'),
              title: item.title,
              cover: coverFile,
              github: item.github || '',
              external: item.external || '',
              cta: item.cta || '',
              tech: item.tech || [],
            };

            const mdContent = `---\n${yaml.dump(frontmatter).trim()}\n---\n\n${
              item.description || ''
            }\n`;
            fs.writeFileSync(path.join(targetDir, 'index.md'), mdContent, 'utf8');
            console.log(
              `  ✓ Synced Featured: "${item.title}" -> ${path.relative(
                PORTFOLIO_ROOT,
                targetDir,
              )}/index.md`,
            );
          });
        }
      } catch (err) {
        console.error(`[sync-data] Error parsing featured.json:`, err.message);
      }
    }

    // 5. Sync projects.json into content/projects/
    const projectsJsonPath = path.join(dataDir, 'projects.json');
    if (fs.existsSync(projectsJsonPath)) {
      try {
        const projects = JSON.parse(fs.readFileSync(projectsJsonPath, 'utf8'));
        if (Array.isArray(projects)) {
          projects.forEach(item => {
            const slug = slugify(item.title);
            const targetFile = path.join(CONTENT_PROJECTS_DIR, `auto-${slug}.md`);

            const frontmatter = {
              date: item.date || '2025-01-01',
              title: item.title,
              github: item.github || '',
              external: item.external || '',
              tech: item.tech || [],
              showInProjects: item.showInProjects !== false,
              company: item.company || '',
            };

            const mdContent = `---\n${yaml.dump(frontmatter).trim()}\n---\n\n${
              item.description || ''
            }\n`;
            fs.writeFileSync(targetFile, mdContent, 'utf8');
            console.log(
              `  ✓ Synced Project: "${item.title}" -> ${path.relative(PORTFOLIO_ROOT, targetFile)}`,
            );
          });
        }
      } catch (err) {
        console.error(`[sync-data] Error parsing projects.json:`, err.message);
      }
    }

    console.log(`[sync-data] Successfully finished portfolio data synchronization!`);
  } finally {
    if (isTemp && fs.existsSync(TEMP_CLONE_DIR)) {
      try {
        fs.rmSync(TEMP_CLONE_DIR, { recursive: true, force: true });
        console.log(`[sync-data] Cleaned up temporary clone directory.`);
      } catch (_) {}
    }
  }
}

sync();
