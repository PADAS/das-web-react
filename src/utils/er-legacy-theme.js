import legacyTokens from '../common/styles/er-legacy-tokens.json';

// A local stand-in for a published `er-legacy` theme, so colors can be tried
// against the running app before DESIGN.md is changed. Everything else keeps
// coming from @allenai/design-system; these are value overrides only.
export const ER_LEGACY_COLORS = Object.fromEntries(
  Object.entries(legacyTokens.color).map(([token, { hex }]) => [token, hex]),
);

// tokens.css declares the light theme on :root, so overriding the same custom
// properties on the same element is enough for every style that reads var().
export const applyErLegacyTheme = (element = document.documentElement) => {
  Object.entries(ER_LEGACY_COLORS).forEach(([token, hex]) => {
    element.style.setProperty(`--er-${token}`, hex);
  });
};
