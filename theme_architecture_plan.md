# Portfolio Theme Architecture Plan

## 1. Executive Summary & Problem Statement

### The Problem

A personal portfolio is a **living document**. Work history, featured projects, certifications, and blog posts are constantly added and modified.

Standard version control strategies for visual redesigns (such as long-lived Git branches or Git tags) fall short in this environment:

- **Git tags** snapshot the entire repository state at a single moment. Checking out an older visual tag pulls back outdated resume information, older projects, and stale copy.
- **Long-lived Git branches** create ongoing merge conflicts when markdown content in `content/` is updated on `main` while UI experiments happen in parallel.

### The Solution

Decouple the **Data/Content Layer** from the **Presentation/Theme Layer** entirely in code:

- The `content/` directory remains the single source of truth for all career data and media.
- Component layouts are organized into isolated visual theme folders (`src/components/themes/<theme-name>/`).
- A central configuration switch controls which theme renders on the site at build time.
- Updating a project or job in Markdown immediately reflects across all existing themes without code changes or merge conflicts.

---

## 2. Architecture Overview

```text
Portfolio Repository
├── content/                     <-- SINGLE SOURCE OF TRUTH (Never duplicated)
│   ├── featured/
│   ├── jobs/
│   ├── projects/
│   └── posts/
│
├── src/
│   ├── config.js                <-- Site metadata, navigation, socials
│   ├── styles/                  <-- Base variables, fonts, shared mixins
│   │
│   ├── components/
│   │   ├── layout.js            <-- Core application wrapper (head, SEO)
│   │   ├── nav.js
│   │   ├── footer.js
│   │   │
│   │   └── themes/              <-- THEME DIRECTORY
│   │       ├── classic/         <-- Current portfolio design
│   │       │   ├── hero.js
│   │       │   ├── about.js
│   │       │   ├── jobs.js
│   │       │   ├── featured.js
│   │       │   ├── contact.js
│   │       │   └── index.js     <-- Barrel export
│   │       │
│   │       ├── modern-bento/    <-- Visual variant A
│   │       │   ├── hero.js
│   │       │   ├── about.js
│   │       │   ├── jobs.js
│   │       │   ├── featured.js
│   │       │   ├── contact.js
│   │       │   └── index.js
│   │       │
│   │       └── minimal-editorial/ <-- Visual variant B
│   │           └── ...
│   │
│   └── pages/
│       └── index.js             <-- Theme Switcher / Controller
```

---

## 3. Data Contract & Invariance Rules

Every theme operates as an interchangeable visual skin over the same Gatsby data layer. To ensure complete plug-and-play compatibility, all themes must adhere to the **Data Contract**:

1. **GraphQL Parity**: Every section component fetches data using the same GraphQL queries, aliases, and filters. No theme-specific fields may be required in Markdown frontmatter.
2. **Prop Consistency**: Components must map existing frontmatter structures:
   - **Jobs**: `date`, `title`, `company`, `location`, `range`, `url`, `html`
   - **Featured Projects**: `date`, `title`, `cover`, `github`, `external`, `tech`, `html`
   - **About**: `title`, `avatar`, `skills`, `html`
3. **Style Isolation**: All styled-components or CSS modules must be strictly scoped to the theme component files. No global stylesheet mutations are permitted.

---

## 4. Implementation Steps

### Step 1: Migrate Existing Components to the `classic` Theme

1. Create directory `src/components/themes/classic/`.
2. Move the existing section files from `src/components/sections/` into `src/components/themes/classic/`:
   - `hero.js`
   - `about.js`
   - `jobs.js`
   - `featured.js`
   - `projects.js`
   - `contact.js`
3. Add a barrel export file at `src/components/themes/classic/index.js`:
   ```javascript
   export { default as Hero } from './hero';
   export { default as About } from './about';
   export { default as Jobs } from './jobs';
   export { default as Featured } from './featured';
   export { default as Projects } from './projects';
   export { default as Contact } from './contact';
   ```

### Step 2: Implement the Theme Controller

Update `src/pages/index.js` to dynamically load the selected theme.

```javascript
import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { Layout } from '@components';

// -------------------------------------------------------------
// Active Theme Configuration
// Options: 'classic' | 'modern-bento' | 'minimal-editorial'
// -------------------------------------------------------------
const ACTIVE_THEME = 'classic';

// Load the selected theme's sections
import * as ClassicTheme from '@components/themes/classic';
import * as ModernBentoTheme from '@components/themes/modern-bento';

const themeMap = {
  classic: ClassicTheme,
  'modern-bento': ModernBentoTheme,
};

const CurrentTheme = themeMap[ACTIVE_THEME] || ClassicTheme;

const StyledMainContainer = styled.main`
  counter-reset: section;
`;

const IndexPage = ({ location }) => (
  <Layout location={location}>
    <StyledMainContainer className="fillHeight">
      <CurrentTheme.Hero />
      <CurrentTheme.About />
      <CurrentTheme.Jobs />
      <CurrentTheme.Featured />
      <CurrentTheme.Projects />
      <CurrentTheme.Contact />
    </StyledMainContainer>
  </Layout>
);

IndexPage.propTypes = {
  location: PropTypes.object.isRequired,
};

export default IndexPage;
```

_(Note: Gatsby can also leverage environment variables such as `GATSBY_THEME=classic` if switching themes via build commands is preferred)._

### Step 3: Bundle and Asset Verification

- Gatsby executes static site generation at compile time.
- Unused theme components imported via ES modules will be evaluated during build, but modern Webpack and Gatsby bundling tree-shake unrendered branches.
- Asset weights (images, videos, fonts) are driven solely by `content/` and `src/images/`, ensuring multiple themes do not duplicate heavy assets.

---

## 5. Maintenance Workflow

When updating career details:

1. Add new job entries in `content/jobs/` or project entries in `content/projects/`.
2. Commit directly to `main`.
3. All themes in `src/components/themes/` instantly render the latest data.

When designing a new look:

1. Create a new folder `src/components/themes/<new-theme>/`.
2. Generate sections using the companion prompt (`prompts/theme-generation-prompt.md`).
3. Set `ACTIVE_THEME = '<new-theme>'` in `src/pages/index.js` to preview.
4. If you ever want to revert, change `ACTIVE_THEME` back to `'classic'`.
