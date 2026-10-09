import * as classic from './classic';

/**
 * Registry of available themes.
 * When a new theme is created:
 * 1. Create `src/components/themes/<new-theme>/`
 * 2. Generate its sections & export them in `src/components/themes/<new-theme>/index.js`
 * 3. Import the theme here and add it to `themes`:
 *    e.g.:
 *    import * as modernBento from './modern-bento';
 *    themes['modern-bento'] = modernBento;
 */
export const themes = {
  classic,
};

export const DEFAULT_THEME = 'classic';

/**
 * Get theme by name with graceful fallback to default classic theme.
 * @param {string} themeName
 * @returns {object} The theme module containing section components
 */
export const getTheme = (themeName = DEFAULT_THEME) =>
  themes[themeName] || themes[DEFAULT_THEME] || themes.classic;

export { classic };
export default themes;
