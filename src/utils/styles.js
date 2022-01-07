export const injectStylesToElement = (element, styles) => Object.entries(styles)
  .forEach(([key, value]) => {
    element.style[key] = value;
  });
