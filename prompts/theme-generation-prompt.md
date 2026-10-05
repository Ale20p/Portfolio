# AI Theme Generation Prompt Template

Use this prompt whenever you want an AI model to design a new theme or redesign a specific section component for your portfolio.

---

## Copyable Master Prompt

```text
You are a senior frontend engineer and UI/UX designer specializing in Gatsby, React, and styled-components.

### Objective
Create a brand-new visual variant of a portfolio section component to fit inside an isolated theme architecture. The design must be fresh and visually distinct, but it MUST strictly adhere to the existing Gatsby GraphQL data contract so that markdown content from the `content/` directory continues to render without modifications.

### Target Theme Details
- Theme Name: [e.g., modern-bento / minimal-editorial / neo-brutalist / cyberpunk]
- Component File Target: [e.g., src/components/themes/<theme-name>/featured.js]
- Reference Original Component: [e.g., src/components/themes/classic/featured.js]
- Target Visual Style: [Describe aesthetics, e.g., Bento grid layout, soft borders, subtle frosted glass cards, monospace accent fonts, high-contrast dark theme]

### Strict Technical Constraints
1. GraphQL Query Invariance:
   - Do NOT alter, add, or remove any fields, aliases, or arguments in the GraphQL query (`graphql` template tag or `useStaticQuery`).
   - The query MUST remain an exact copy of the reference file's query so the data contract remains 100% compatible with existing Markdown files.

2. Prop and Data Contract:
   - Consume the exact same data structure passed into or retrieved by the component (e.g., `data.featured.edges`, `node.frontmatter`, `node.html`).
   - Maintain support for all existing frontmatter properties (`title`, `cover`, `tech`, `github`, `external`, `company`, `range`, `url`, etc.).

3. Link and Media Handling:
   - Preserve all Gatsby image implementations (`<GatsbyImage>` / `<Img>`).
   - Retain all outbound links with appropriate security attributes (`target="_blank"`, `rel="noopener noreferrer"`).
   - Use existing icon imports (e.g., `@components/icons`) or cleanly inline standard SVG icons.

4. Style Encapsulation:
   - Build all layout and aesthetic styles using styled-components within this file.
   - Do not mutate global stylesheets or introduce side effects that would affect other themes.
   - Ensure the layout is fully responsive across mobile (< 480px), tablet (< 768px), and desktop breakpoints.

5. Functional Hooks & Animations:
   - Preserve or cleanly adapt any existing scroll reveal logic (e.g., ScrollReveal, IntersectionObserver) and React hooks (`useRef`, `useState`, `useEffect`).

### Deliverable
- Provide the complete, drop-in React component code for this file.
- Provide clean, production-ready code with no placeholders or truncated code blocks.

---

### Reference Code (Source Component to Redesign)
[PASTE CONTENT OF CLASSIC COMPONENT HERE, e.g., src/components/themes/classic/featured.js]
```

---

## Example Usage Checklist

1. [ ] Create your new theme folder: `mkdir -p src/components/themes/modern-bento`
2. [ ] Copy the prompt above into your AI tool.
3. [ ] Set the `Target Theme Details` (e.g., theme name and visual vibe).
4. [ ] Paste the current `classic` version of the file at the bottom of the prompt.
5. [ ] Save the generated code into `src/components/themes/<theme-name>/<section>.js`.
6. [ ] Repeat for the remaining sections (`hero.js`, `about.js`, `jobs.js`, etc.).
7. [ ] Export all sections in `src/components/themes/<theme-name>/index.js`.
8. [ ] Switch `ACTIVE_THEME` in `src/pages/index.js` and verify with `gatsby develop`.
