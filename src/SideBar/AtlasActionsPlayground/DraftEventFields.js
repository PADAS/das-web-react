import { useEffect, useState } from 'react';

import { FORM_ELEMENT_TYPES } from '../../utils/form-schemas/constants';
import useRunHostAction from '../../hostActions/useRunHostAction';

import CheckList from './CheckList';

import * as styles from './styles.module.scss';

const toValue = (field, text) => {
  if (text === '') return undefined;
  if (field.type === FORM_ELEMENT_TYPES.NUMERIC) return Number(text);
  if (field.type === FORM_ELEMENT_TYPES.BOOLEAN) return text === 'true';
  if (field.type === FORM_ELEMENT_TYPES.DATE_TIME) return new Date(text).toISOString();

  return text;
};

const FieldInput = ({ field, onChange, t, value }) => {
  if (field.type === FORM_ELEMENT_TYPES.CHOICE_LIST && field.multiple) {
    return <CheckList
      label={field.label}
      onChange={(values) => onChange(values.length ? values : undefined)}
      options={field.options.map((option) => ({ id: option.value, label: option.label }))}
      value={value ?? []}
    />;
  }

  let input;
  switch (field.type) {
  case FORM_ELEMENT_TYPES.TEXT:
  case FORM_ELEMENT_TYPES.NUMERIC:
    input = <input
      className={styles.input}
      onChange={(event) => onChange(toValue(field, event.target.value))}
      type={field.type === FORM_ELEMENT_TYPES.NUMERIC ? 'number' : 'text'}
      value={value ?? ''}
    />;
    break;

  case FORM_ELEMENT_TYPES.BOOLEAN:
    input = <select className={styles.select} onChange={(event) => onChange(toValue(field, event.target.value))} value={value === undefined ? '' : String(value)}>
      <option value="">{t('fields.notFilled')}</option>
      <option value="true">{t('fields.yes')}</option>
      <option value="false">{t('fields.no')}</option>
    </select>;
    break;

  case FORM_ELEMENT_TYPES.CHOICE_LIST:
    input = <select className={styles.select} onChange={(event) => onChange(toValue(field, event.target.value))} value={value ?? ''}>
      <option value="">{t('fields.notFilled')}</option>
      {field.options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
    </select>;
    break;

  case FORM_ELEMENT_TYPES.DATE_TIME:
    input = <input className={styles.input} onChange={(event) => onChange(toValue(field, event.target.value))} type="datetime-local" />;
    break;

  default:
    input = <span className={styles.empty}>{t('fields.fileOnly')}</span>;
  }

  return <label className={styles.field}>
    <span className={styles.label}>{field.label}{field.required ? ' *' : ''}</span>
    {input}
  </label>;
};

// Stands in for Atlas reading the form: lists the event type's fields, as
// describe_event_type returns them, for the user to fill in as Atlas would.
const DraftEventFields = ({ eventDetails, eventTypeId, onChange, t }) => {
  const runHostAction = useRunHostAction();

  const [description, setDescription] = useState(null);

  useEffect(() => {
    let isCurrent = true;
    if (eventTypeId) {
      runHostAction('describe_event_type', { event_type_id: eventTypeId })
        .then((reply) => isCurrent && setDescription(reply));
    }

    return () => { isCurrent = false; };
  }, [eventTypeId, runHostAction]);

  if (!eventTypeId) return null;
  if (!description) return <p className={styles.empty}>{t('loading')}</p>;
  if (!description.ok) return <p className={styles.error}>{description.error.message}</p>;

  const setFieldValue = (name, value) => {
    const { [name]: _previous, ...otherDetails } = eventDetails;
    onChange(value === undefined ? otherDetails : { ...otherDetails, [name]: value });
  };

  return description.result.sections.map((section, index) => <fieldset className={styles.checkList} key={index}>
    {(section.label || section.conditional) && <legend className={styles.label}>
      {section.label}{section.conditional ? ` (${t('fields.conditional')})` : ''}
    </legend>}
    {section.fields.map((field) => <FieldInput
      field={field}
      key={field.name}
      onChange={(value) => setFieldValue(field.name, value)}
      t={t}
      value={eventDetails[field.name]}
    />)}
  </fieldset>);
};

export default DraftEventFields;
