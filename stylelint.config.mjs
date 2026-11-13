export default {
  extends: ['stylelint-config-standard-scss', 'stylelint-config-css-modules'],
  overrides: [
    {
      // Global stylesheets target markup from Bootstrap, Mapbox and others.
      files: ['**/!(_*|*.module).scss'],
      rules: {
        'selector-class-pattern': null,
        'selector-id-pattern': null,
      },
    },
  ],
  reportDescriptionlessDisables: true,
  reportInvalidScopeDisables: true,
  reportNeedlessDisables: true,
  rules: {
    'selector-class-pattern': '^[a-z][a-zA-Z0-9]*$',
  },
};
