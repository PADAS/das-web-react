export const injectStylesToElement = (element, styles) => Object.keys(styles)
  .forEach((styleKey) => {
    element.style[styleKey] = styles[styleKey];
  });
