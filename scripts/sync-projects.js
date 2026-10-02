/* eslint-disable */
/**
 * sync-projects.js
 *
 * Automatically synchronizes projects from the "Projects" repository into the Portfolio.
 * - Detects project metadata from `portfolio.json` or YAML frontmatter in `README.md`.
 * - Top highlights (featured: true) are placed in `content/featured/auto-<slug>/`.
 * - Other noteworthy projects and archive are placed in `content/projects/auto-<slug>.md`.
 * - Safely preserves manual external projects (e.g. FantasyPicks, Academic Management System).
 * - Works locally (using ../Projects) and remotely (e.g. on Vercel via git clone).
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const yaml = require('js-yaml');

// Paths
const PORTFOLIO_ROOT = path.resolve(__dirname, '..');
const CONTENT_PROJECTS_DIR = path.join(PORTFOLIO_ROOT, 'content', 'projects');
const CONTENT_FEATURED_DIR = path.join(PORTFOLIO_ROOT, 'content', 'featured');
const DEFAULT_COVER_IMAGE = path.join(PORTFOLIO_ROOT, 'src', 'images', 'demo.png');

// Fallback Git URL for remote environments (e.g. Vercel)
const PROJECTS_GITHUB_REPO = 'https://github.com/Ale20p/Projects.git';
const TEMP_CLONE_DIR = path.join(PORTFOLIO_ROOT, '.temp_projects_sync');

// Directories to skip when scanning
const IGNORED_DIRS = new Set([
  '.git',
  '.idea',
  '.mvn',
  '.cache',
  '.husky',
  'node_modules',
  'target',
  'dist',
  'build',
  'bin',
  'out',
  'Data',
  'public',
]);

/**
 * Helper to slugify folder names
 */
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
 * Format date to YYYY-MM-DD
 */
function formatDate(dateInput) {
  if (!dateInput) {
    const now = new Date();
    return now.toISOString().split('T')[0];
  }
  const str = String(dateInput).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str;
  }
  if (/^\d{4}$/.test(str)) {
    return `${str}-01-01`;
  }
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split('T')[0];
  }
  return new Date().toISOString().split('T')[0];
}

/**
 * Resolve the root directory of the Projects repository
 */
function resolveProjectsDir() {
  // 1. Explicit env var
  if (process.env.PROJECTS_DIR && fs.existsSync(process.env.PROJECTS_DIR)) {
    console.log(`[sync-projects] Using PROJECTS_DIR from env: ${process.env.PROJECTS_DIR}`);
    return { dir: path.resolve(process.env.PROJECTS_DIR), isTemp: false };
  }

  // 2. Local sibling directory (c:\Users\alexp\WORKSPACES\InProProjects\Projects)
  const siblingDir = path.resolve(PORTFOLIO_ROOT, '..', 'Projects');
  if (fs.existsSync(siblingDir)) {
    console.log(`[sync-projects] Found local sibling Projects repo: ${siblingDir}`);
    return { dir: siblingDir, isTemp: false };
  }

  // 3. Fallback for CI/CD / Vercel: Clone repository
  console.log(
    `[sync-projects] Local Projects folder not found. Cloning from GitHub (${PROJECTS_GITHUB_REPO})...`,
  );
  try {
    if (fs.existsSync(TEMP_CLONE_DIR)) {
      fs.rmSync(TEMP_CLONE_DIR, { recursive: true, force: true });
    }
    const token = process.env.GITHUB_TOKEN;
    const cloneUrl = token
      ? PROJECTS_GITHUB_REPO.replace('https://', `https://${token}@`)
      : PROJECTS_GITHUB_REPO;

    execSync(`git clone --depth 1 "${cloneUrl}" "${TEMP_CLONE_DIR}"`, {
      stdio: 'inherit',
      timeout: 60000,
    });

    return { dir: TEMP_CLONE_DIR, isTemp: true };
  } catch (err) {
    console.error(`[sync-projects] Failed to clone Projects repository:`, err.message);
    return { dir: null, isTemp: false };
  }
}

/**
 * Extract frontmatter and body from markdown
 */
function extractFrontmatter(content) {
  const frontmatterRegex = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/;
  const match = content.match(frontmatterRegex);
  if (match) {
    try {
      const data = yaml.load(match[1]) || {};
      const body = match[2] || '';
      return { data, body };
    } catch (e) {
      console.warn(`[sync-projects] Failed to parse YAML frontmatter: ${e.message}`);
    }
  }
  return { data: null, body: content };
}

/**
 * Extract title from README markdown
 */
function extractTitleFromReadme(body) {
  const match = body.match(/^#\s+(.+)$/m);
  if (match) {
    return match[1].trim();
  }
  return null;
}

/**
 * Extract summary paragraph from README markdown
 */
function extractSummaryFromReadme(body) {
  const lines = body.split(/\r?\n/);
  const paragraphs = [];
  let currentParagraph = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (
      trimmed.startsWith('#') ||
      trimmed.startsWith('![') ||
      trimmed.startsWith('[!') ||
      trimmed.startsWith('```')
    ) {
      if (currentParagraph.length > 0) {
        paragraphs.push(currentParagraph.join(' ').trim());
        currentParagraph = [];
      }
      continue;
    }
    if (trimmed === '') {
      if (currentParagraph.length > 0) {
        paragraphs.push(currentParagraph.join(' ').trim());
        currentParagraph = [];
      }
      continue;
    }
    currentParagraph.push(trimmed);
  }
  if (currentParagraph.length > 0) {
    paragraphs.push(currentParagraph.join(' ').trim());
  }

  // Find first suitable paragraph
  for (const p of paragraphs) {
    // Avoid table of contents or short links
    if (p.length > 30 && !p.startsWith('-') && !p.startsWith('*')) {
      return p;
    }
  }
  return paragraphs[0] || '';
}

/**
 * Detect languages / technologies based on directory & files
 */
function detectTech(projectDir, rootDir) {
  const tech = new Set();
  const rel = path.relative(rootDir, projectDir).replace(/\\/g, '/');
  const parts = rel.split('/');

  // Check category directory (e.g. Java, Python, Vue)
  if (parts.length > 1) {
    const category = parts[0];
    if (category.toLowerCase() === 'java') {
      tech.add('Java');
    }
    if (category.toLowerCase() === 'python') {
      tech.add('Python');
    }
    if (category.toLowerCase() === 'vue') {
      tech.add('Vue.js');
    }
  }

  if (fs.existsSync(path.join(projectDir, 'pom.xml'))) {
    tech.add('Java');
    tech.add('Maven');
  }
  if (fs.existsSync(path.join(projectDir, 'package.json'))) {
    try {
      const pkg = JSON.parse(fs.readFileSync(path.join(projectDir, 'package.json'), 'utf8'));
      const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
      if (allDeps.nuxt) {
        tech.add('Nuxt');
      }
      if (allDeps.vue) {
        tech.add('Vue.js');
      }
      if (allDeps.react) {
        tech.add('React');
      }
      if (allDeps.typescript) {
        tech.add('TypeScript');
      }
      if (tech.size === 0) {
        tech.add('JavaScript');
      }
    } catch (_) {
      tech.add('JavaScript');
    }
  }
  if (fs.existsSync(path.join(projectDir, 'requirements.txt'))) {
    tech.add('Python');
  }

  return Array.from(tech);
}

/**
 * Scan directory recursively for projects
 */
function findProjects(dir, rootDir, maxDepth = 4, currentDepth = 0) {
  const projects = [];
  if (currentDepth > maxDepth || !fs.existsSync(dir)) {
    return projects;
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  let hasPortfolioJson = false;
  let hasReadmeFrontmatter = false;
  let readmeFile = null;

  for (const entry of entries) {
    if (entry.isFile()) {
      if (entry.name.toLowerCase() === 'portfolio.json') {
        hasPortfolioJson = true;
      } else if (entry.name.toLowerCase() === 'readme.md') {
        readmeFile = path.join(dir, entry.name);
      }
    }
  }

  if (readmeFile) {
    try {
      const content = fs.readFileSync(readmeFile, 'utf8');
      const { data } = extractFrontmatter(content);
      if (data && (data.title || data.tech || data.featured !== undefined || data.portfolio)) {
        hasReadmeFrontmatter = true;
      }
    } catch (_) {}
  }

  // If this folder has portfolio.json or frontmatter in README.md, treat as a project!
  if (hasPortfolioJson || hasReadmeFrontmatter) {
    projects.push({
      dir,
      hasPortfolioJson,
      hasReadmeFrontmatter,
      readmeFile,
    });
    // Do not recurse into subdirectories of an identified project
    return projects;
  }

  // Otherwise, recurse into subdirectories
  for (const entry of entries) {
    if (entry.isDirectory() && !IGNORED_DIRS.has(entry.name)) {
      projects.push(
        ...findProjects(path.join(dir, entry.name), rootDir, maxDepth, currentDepth + 1),
      );
    }
  }

  return projects;
}

/**
 * Process a project and extract unified metadata
 */
function parseProject(projectInfo, rootDir) {
  const { dir, hasPortfolioJson, readmeFile } = projectInfo;
  const folderName = path.basename(dir);
  const relPath = path.relative(rootDir, dir).replace(/\\/g, '/');

  let jsonData = {};
  if (hasPortfolioJson) {
    try {
      const raw = fs.readFileSync(path.join(dir, 'portfolio.json'), 'utf8');
      jsonData = JSON.parse(raw);
    } catch (e) {
      console.warn(`[sync-projects] Warning: Failed to parse portfolio.json in ${dir}:`, e.message);
    }
  }

  let readmeData = {};
  let readmeBody = '';
  if (readmeFile && fs.existsSync(readmeFile)) {
    try {
      const raw = fs.readFileSync(readmeFile, 'utf8');
      const parsed = extractFrontmatter(raw);
      readmeData = parsed.data || {};
      // If nested inside "portfolio:" key, unpack it
      if (readmeData.portfolio && typeof readmeData.portfolio === 'object') {
        readmeData = { ...readmeData, ...readmeData.portfolio };
      }
      readmeBody = parsed.body;
    } catch (e) {
      console.warn(`[sync-projects] Warning: Failed to read README.md in ${dir}:`, e.message);
    }
  }

  // Merge metadata: portfolio.json takes precedence over readme frontmatter
  const meta = { ...readmeData, ...jsonData };

  // Compute title
  const title = meta.title || extractTitleFromReadme(readmeBody) || folderName;

  // Compute description
  const description =
    meta.description || extractSummaryFromReadme(readmeBody) || `Project ${title}`;

  // Compute tech
  let tech = Array.isArray(meta.tech) ? meta.tech : [];
  if (tech.length === 0) {
    tech = detectTech(dir, rootDir);
  }
  if (tech.length === 0) {
    tech = ['Software'];
  }

  // GitHub URL
  const defaultGithub = `https://github.com/Ale20p/Projects/tree/main/${relPath}`;
  const github = meta.github !== undefined ? meta.github : defaultGithub;

  // External demo link
  const external = meta.external || '';

  // CTA link (for featured)
  const cta = meta.cta || '';

  // Company / Made at (for archive)
  const company = meta.company || '';

  // Featured flag
  const isFeatured = Boolean(meta.featured || meta.highlight || meta.top);

  // Featured order (1, 2, 3...)
  let featuredOrder = 1;
  if (typeof meta.featured === 'number') {
    featuredOrder = meta.featured;
  } else if (meta.featuredOrder) {
    featuredOrder = Number(meta.featuredOrder) || 1;
  } else if (meta.rank) {
    featuredOrder = Number(meta.rank) || 1;
  } else if (meta.order) {
    featuredOrder = Number(meta.order) || 1;
  }

  // Date for sorting
  const date = formatDate(meta.date);

  // Cover image for featured projects
  let coverImageSource = null;
  if (meta.cover) {
    const candidate = path.resolve(dir, meta.cover);
    if (fs.existsSync(candidate)) {
      coverImageSource = candidate;
    }
  }
  if (!coverImageSource) {
    // Look for common image names in project directory
    const imageNames = [
      'cover.png',
      'cover.jpg',
      'cover.webp',
      'screenshot.png',
      'screenshot.jpg',
      'preview.png',
      `${folderName}.png`,
      `${slugify(folderName)}.png`,
    ];
    for (const name of imageNames) {
      const candidate = path.join(dir, name);
      if (fs.existsSync(candidate)) {
        coverImageSource = candidate;
        break;
      }
    }
  }
  if (!coverImageSource && fs.existsSync(DEFAULT_COVER_IMAGE)) {
    coverImageSource = DEFAULT_COVER_IMAGE;
  }

  const showInProjects = meta.showInProjects !== false;
  const slug = slugify(folderName);

  return {
    dir,
    slug,
    title,
    description,
    tech,
    github,
    external,
    cta,
    company,
    isFeatured,
    featuredOrder,
    date,
    coverImageSource,
    showInProjects,
    relPath,
  };
}

/**
 * Main sync logic
 */
function sync() {
  console.log(`[sync-projects] Starting sync from Projects repository...`);

  const { dir: projectsDir, isTemp } = resolveProjectsDir();
  if (!projectsDir) {
    console.error(`[sync-projects] Unable to locate Projects directory. Skipping sync.`);
    return;
  }

  try {
    // Find all projects
    const rawProjects = findProjects(projectsDir, projectsDir);
    console.log(
      `[sync-projects] Found ${rawProjects.length} projects with portfolio configuration.`,
    );

    const parsedProjects = rawProjects.map(p => parseProject(p, projectsDir));

    // Ensure output directories exist
    fs.mkdirSync(CONTENT_PROJECTS_DIR, { recursive: true });
    fs.mkdirSync(CONTENT_FEATURED_DIR, { recursive: true });

    // Track active auto-synced slugs
    const activeProjectSlugs = new Set();
    const activeFeaturedSlugs = new Set();

    for (const proj of parsedProjects) {
      if (proj.isFeatured) {
        activeFeaturedSlugs.add(proj.slug);
        const featuredDir = path.join(CONTENT_FEATURED_DIR, `auto-${proj.slug}`);
        fs.mkdirSync(featuredDir, { recursive: true });

        // Copy cover image
        let coverFileName = 'cover.png';
        if (proj.coverImageSource && fs.existsSync(proj.coverImageSource)) {
          const ext = path.extname(proj.coverImageSource) || '.png';
          coverFileName = `cover${ext}`;
          fs.copyFileSync(proj.coverImageSource, path.join(featuredDir, coverFileName));
        }

        const frontmatter = {
          date: String(proj.featuredOrder),
          title: proj.title,
          cover: `./${coverFileName}`,
          github: proj.github,
          external: proj.external,
          cta: proj.cta,
          tech: proj.tech,
          isAutoSynced: true,
          projectSlug: proj.slug,
          sourcePath: proj.relPath,
        };

        const mdContent = `---\n${yaml.dump(frontmatter).trim()}\n---\n\n${proj.description}\n`;
        fs.writeFileSync(path.join(featuredDir, 'index.md'), mdContent, 'utf8');
        console.log(
          `  ✓ Synced FEATURED highlight: "${proj.title}" -> content/featured/auto-${proj.slug}/`,
        );
      } else {
        activeProjectSlugs.add(proj.slug);
        const projectFile = path.join(CONTENT_PROJECTS_DIR, `auto-${proj.slug}.md`);

        const frontmatter = {
          date: proj.date,
          title: proj.title,
          github: proj.github,
          external: proj.external,
          tech: proj.tech,
          showInProjects: proj.showInProjects,
          company: proj.company,
          isAutoSynced: true,
          projectSlug: proj.slug,
          sourcePath: proj.relPath,
        };

        const mdContent = `---\n${yaml.dump(frontmatter).trim()}\n---\n\n${proj.description}\n`;
        fs.writeFileSync(projectFile, mdContent, 'utf8');
        console.log(
          `  ✓ Synced NOTEWORTHY project: "${proj.title}" -> content/projects/auto-${proj.slug}.md`,
        );
      }
    }

    // Clean up obsolete auto-synced files (without touching manual external projects)
    // 1. Projects folder
    if (fs.existsSync(CONTENT_PROJECTS_DIR)) {
      const files = fs.readdirSync(CONTENT_PROJECTS_DIR);
      for (const file of files) {
        if (file.startsWith('auto-') && file.endsWith('.md')) {
          const slug = file.replace(/^auto-/, '').replace(/\.md$/, '');
          if (!activeProjectSlugs.has(slug)) {
            console.log(`  - Removing obsolete auto-synced file: ${file}`);
            fs.unlinkSync(path.join(CONTENT_PROJECTS_DIR, file));
          }
        }
      }
    }

    // 2. Featured folder
    if (fs.existsSync(CONTENT_FEATURED_DIR)) {
      const dirs = fs.readdirSync(CONTENT_FEATURED_DIR, { withFileTypes: true });
      for (const d of dirs) {
        if (d.isDirectory() && d.name.startsWith('auto-')) {
          const slug = d.name.replace(/^auto-/, '');
          if (!activeFeaturedSlugs.has(slug)) {
            console.log(`  - Removing obsolete auto-synced featured dir: ${d.name}`);
            fs.rmSync(path.join(CONTENT_FEATURED_DIR, d.name), { recursive: true, force: true });
          }
        }
      }
    }

    console.log(`[sync-projects] Successfully finished project synchronization!`);
  } finally {
    // If we used a temporary clone, clean it up
    if (isTemp && fs.existsSync(TEMP_CLONE_DIR)) {
      try {
        fs.rmSync(TEMP_CLONE_DIR, { recursive: true, force: true });
        console.log(`[sync-projects] Cleaned up temporary clone directory.`);
      } catch (_) {}
    }
  }
}

// Execute
sync();
