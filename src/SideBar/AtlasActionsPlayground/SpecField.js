import { useState } from 'react';

import { humanizePropertyName, narrowOptions } from './specSteps';

import CheckList from './CheckList';
import DraftEventFields from './DraftEventFields';

import * as styles from './styles.module.scss';

const allowsNull = (schema) => Array.isArray(schema.type) && schema.type.includes('null');

const mainType = (schema) => (Array.isArray(schema.type) ? schema.type.find((type) => type !== 'null') : schema.type);

// datetime-local wants local time without a zone.
const toLocalInputValue = (isoString) => {
  const date = new Date(isoString);

  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};

const toNumber = (text) => (text === '' ? undefined : Number(text));

const SourceStatus = ({ source, t }) => {
  if (!source) return <p className={styles.error}>{t('unknownSource')}</p>;
  if (source.isLoading) return <p className={styles.empty}>{t('loading')}</p>;
  if (source.error) return <p className={styles.error}>{t('loadError')}</p>;

  return null;
};

// A list from site data. Narrowed to the parent property's picks when it
// names one with "x-within", unless the user asks for all of them.
const SourceList = ({ label, name, onChange, properties, schema, sources, t, value, values }) => {
  const [showsAll, setShowsAll] = useState(false);

  const source = sources[schema['x-source']];
  const status = <SourceStatus source={source} t={t} />;
  if (!source || source.isLoading || source.error) return status;
  if (!source.options.length) {
    return <p className={styles.empty}>{t(`emptySources.${schema['x-source']}`, { defaultValue: t('noOptions') })}</p>;
  }

  const within = schema['x-within'];
  const parentIds = within ? values[within] : null;
  const parentLabel = within ? t(`properties.${within}`, { defaultValue: humanizePropertyName(within) }).toLowerCase() : '';
  const isNarrowed = !!parentIds?.length && !showsAll;
  const options = isNarrowed
    ? narrowOptions(source.options, properties[within]['x-source'], parentIds)
    : source.options;

  const narrowing = within && <p className={styles.description}>
    {parentIds?.length
      ? <label className={styles.option}>
        <input checked={!showsAll} onChange={(event) => setShowsAll(!event.target.checked)} type="checkbox" />
        <span>{t('narrowedTo', { label: parentLabel, count: parentIds.length })}</span>
      </label>
      : t('narrowHint', { label: parentLabel })}
  </p>;

  if (mainType(schema) === 'array') {
    return <>
      {narrowing}
      <CheckList label={label} onChange={onChange} options={options} value={value ?? []} />
    </>;
  }

  return <>
    {narrowing}
    <label className={styles.field}>
      <span className={styles.label}>{label}</span>
      <select className={styles.select} id={name} onChange={(event) => onChange(event.target.value || undefined)} value={value ?? ''}>
        <option value="">{t('choose')}</option>
        {options.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
      </select>
    </label>
  </>;
};

// One property of a tool's input schema, rendered from its type.
const SpecField = ({ name, onChange, properties, required = false, schema, sources, t, value, values }) => {
  const label = `${t(`properties.${name}`, { defaultValue: humanizePropertyName(name) })}${required ? ' *' : ''}`;
  const description = schema.description && <span className={styles.description}>{schema.description}</span>;

  if (schema['x-source'] === 'event_type_fields') {
    return <DraftEventFields
      eventDetails={value ?? {}}
      eventTypeId={values[schema['x-within']]}
      onChange={onChange}
      t={t}
    />;
  }

  if (schema['x-source']) {
    return <div className={styles.field}>
      <SourceList
        label={label}
        name={name}
        onChange={onChange}
        properties={properties}
        schema={schema}
        sources={sources}
        t={t}
        value={value}
        values={values}
      />
      {description}
    </div>;
  }

  if (mainType(schema) === 'array' && schema.items?.enum) {
    return <div className={styles.field}>
      <CheckList
        label={label}
        onChange={onChange}
        options={schema.items.enum.map((option) => ({ id: option, label: humanizePropertyName(option) }))}
        value={value ?? []}
      />
      {description}
    </div>;
  }

  if (mainType(schema) === 'boolean') {
    return <div className={styles.field}>
      <label className={styles.option}>
        <input checked={!!value} onChange={(event) => onChange(event.target.checked)} type="checkbox" />
        <span>{label}</span>
      </label>
      {description}
    </div>;
  }

  if (mainType(schema) === 'object' && schema.properties) {
    return <fieldset className={styles.checkList}>
      <legend className={styles.label}>{label}</legend>
      {description}
      {Object.entries(schema.properties).map(([childName, childSchema]) => <SpecField
        key={childName}
        name={childName}
        onChange={(childValue) => {
          const { [childName]: _previous, ...others } = value ?? {};
          const next = childValue === undefined ? others : { ...others, [childName]: childValue };
          onChange(Object.keys(next).length ? next : undefined);
        }}
        properties={schema.properties}
        required={schema.required?.includes(childName)}
        schema={childSchema}
        sources={sources}
        t={t}
        value={value?.[childName]}
        values={value ?? {}}
      />)}
    </fieldset>;
  }

  let input;
  if (schema.format === 'date-time') {
    input = <>
      <input
        className={styles.input}
        disabled={value === null}
        onChange={(event) => onChange(event.target.value ? new Date(event.target.value).toISOString() : undefined)}
        type="datetime-local"
        value={value ? toLocalInputValue(value) : ''}
      />
      {allowsNull(schema) && <label className={styles.option}>
        <input checked={value === null} onChange={(event) => onChange(event.target.checked ? null : undefined)} type="checkbox" />
        <span>{t('nullValue')}</span>
      </label>}
    </>;
  } else if (mainType(schema) === 'number' || mainType(schema) === 'integer') {
    input = <input
      className={styles.input}
      max={schema.maximum}
      min={schema.minimum}
      onChange={(event) => onChange(toNumber(event.target.value))}
      step="any"
      type="number"
      value={value ?? ''}
    />;
  } else {
    input = <input
      className={styles.input}
      onChange={(event) => onChange(event.target.value)}
      type="text"
      value={value ?? ''}
    />;
  }

  return <label className={styles.field}>
    <span className={styles.label}>{label}</span>
    {input}
    {description}
  </label>;
};

export default SpecField;
