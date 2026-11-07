// Builds the picker from a tool's input schema, so a new tool needs no form
// code: one step per property with an "x-source", then one step for the other
// properties, then the review.

export const STEP_KINDS = { OPTIONS: 'options', REVIEW: 'review', SOURCE: 'source' };

const hasSource = (propertySchema) => !!propertySchema['x-source'];

// A property comes after the one whose picks narrow it.
const orderSourceProperties = (properties) => {
  const ordered = [];
  const place = (name) => {
    if (ordered.includes(name)) return;

    const within = properties[name]['x-within'];
    if (within && hasSource(properties[within] ?? {})) place(within);

    ordered.push(name);
  };
  Object.keys(properties).filter((name) => hasSource(properties[name])).forEach(place);

  return ordered;
};

export const buildSteps = (inputSchema) => {
  const properties = inputSchema.properties ?? {};
  const optionNames = Object.keys(properties).filter((name) => !hasSource(properties[name]));

  return [
    ...orderSourceProperties(properties).map((name) => ({ kind: STEP_KINDS.SOURCE, names: [name] })),
    ...(optionNames.length ? [{ kind: STEP_KINDS.OPTIONS, names: optionNames }] : []),
    { kind: STEP_KINDS.REVIEW, names: [] },
  ];
};

const isEmpty = (value) => value === undefined
  || value === ''
  || (Array.isArray(value) && !value.length)
  || (value !== null && typeof value === 'object' && !Array.isArray(value) && !Object.keys(value).length);

// Leaves out what nobody picked, so the file carries only the user's choices.
// A required property stays, and a false flag stays only when required.
export const toArguments = (inputSchema, values) => {
  const required = inputSchema.required ?? [];

  return Object.fromEntries(Object.keys(inputSchema.properties ?? {})
    .filter((name) => required.includes(name)
      ? values[name] !== undefined
      : !isEmpty(values[name]) && values[name] !== false)
    .map((name) => [name, values[name]]));
};

// The defaults a picker starts from: a required flag starts false.
export const initialValues = (inputSchema) => Object.fromEntries(
  (inputSchema.required ?? [])
    .filter((name) => inputSchema.properties[name].type === 'boolean')
    .map((name) => [name, false])
);

// Keeps the options that belong to any picked parent. With no parent picked,
// keeps them all.
export const narrowOptions = (options, parentSource, parentIds) => (parentIds?.length
  ? options.filter((option) => option.parents?.[parentSource]?.some((parentId) => parentIds.includes(parentId)))
  : options);

export const humanizePropertyName = (name) => {
  const words = name.replace(/_ids?$/, '').replaceAll('_', ' ');

  return words.charAt(0).toUpperCase() + words.slice(1);
};
