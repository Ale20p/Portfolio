/* eslint-disable */
/**
 * sync-data.js
 *
 * Automatically synchronizes profile & experience data and images from "Portfolio-Data".
 * - Copies JSON files into `src/data/` (meta, hero, about, jobs, contact).
 * - Syncs all images from `Portfolio-Data/images/` into `src/data/images/` and `src/images/`.
 * - Converts `jobs.json` into markdown files under `content/jobs/<company>/index.md`.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const yaml = require('js-yaml');

const PORTFOLIO_ROOT = path.resolve(__dirname, '..');
const SRC_DATA_DIR = path.join(PORTFOLIO_ROOT, 'src', 'data');
const SRC_DATA_IMAGES_DIR = path.join(SRC_DATA_DIR, 'images');
const CONTENT_JOBS_DIR = path.join(PORTFOLIO_ROOT, 'content', 'jobs');

const DATA_GITHUB_REPO = 'https://github.com/Ale20p/Portfolio-Data.git';
const TEMP_CLONE_DIR = path.join(PORTFOLIO_ROOT, '.temp_data_sync');

const JSON_FILES = ['meta.json', 'hero.json', 'about.json', 'jobs.json', 'contact.json'];

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

function sync() {
  console.log(`[sync-data] Starting sync from Portfolio-Data repository...`);

  const { dir: dataDir, isTemp } = resolveDataDir();
  if (!dataDir) {
    console.error(`[sync-data] Unable to locate Portfolio-Data directory. Skipping sync.`);
    return;
  }

  try {
    fs.mkdirSync(SRC_DATA_DIR, { recursive: true });
    fs.mkdirSync(SRC_DATA_IMAGES_DIR, { recursive: true });
    fs.mkdirSync(CONTENT_JOBS_DIR, { recursive: true });

    // 1. Remove obsolete featured.json / projects.json from src/data if present
    for (const obsolete of ['featured.json', 'projects.json']) {
      const obsoletePath = path.join(SRC_DATA_DIR, obsolete);
      if (fs.existsSync(obsoletePath)) {
        fs.unlinkSync(obsoletePath);
      }
    }

    // 2. Copy JSON files to src/data
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

    // 3. Copy all images from Portfolio-Data/images/ to src/data/images/
    const sourceImagesDir = path.join(dataDir, 'images');
    if (fs.existsSync(sourceImagesDir)) {
      const imageFiles = fs.readdirSync(sourceImagesDir);
      for (const imgFile of imageFiles) {
        const srcImg = path.join(sourceImagesDir, imgFile);
        if (fs.statSync(srcImg).isFile()) {
          fs.copyFileSync(srcImg, path.join(SRC_DATA_IMAGES_DIR, imgFile));
          console.log(`  ✓ Cached image: "${imgFile}" -> src/data/images/${imgFile}`);
        }
      }
    }

    // 4. Sync avatar image to src/images/
    const aboutJsonPath = path.join(dataDir, 'about.json');
    if (fs.existsSync(aboutJsonPath)) {
      try {
        const about = JSON.parse(fs.readFileSync(aboutJsonPath, 'utf8'));
        if (about.avatar) {
          const avatarBase = path.basename(about.avatar.trim().replace(/^['"]+|['"]+$/g, ''));
          const candidateAvatar = path.join(sourceImagesDir, avatarBase);
          if (fs.existsSync(candidateAvatar)) {
            const destAvatar = path.join(PORTFOLIO_ROOT, 'src', 'images', avatarBase);
            fs.copyFileSync(candidateAvatar, destAvatar);
            console.log(`  ✓ Synced Avatar: "${avatarBase}" -> src/images/${avatarBase}`);
          }
        }
      } catch (_) {}
    }

    // 5. Sync jobs.json into content/jobs/
    const jobsJsonPath = path.join(dataDir, 'jobs.json');
    if (fs.existsSync(jobsJsonPath)) {
      try {
        const jobs = JSON.parse(fs.readFileSync(jobsJsonPath, 'utf8'));
        if (Array.isArray(jobs) && jobs.length > 0) {
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
