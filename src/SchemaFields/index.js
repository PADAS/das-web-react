import React, { useCallback, useMemo, useRef, useState } from 'react';
import Button from 'react-bootstrap/Button';
import { canExpand, getInputProps, getTemplate, getUiOptions } from '@rjsf/utils';
import { components } from 'react-select';
import Form from 'react-bootstrap/Form';
import isPlainObject from 'lodash/isPlainObject';
import { useTranslation } from 'react-i18next';

import { ReactComponent as AddButtonIcon } from '../common/images/icons/add_button.svg';
import { ReactComponent as ArrowDownIcon } from '../common/images/icons/arrow-down.svg';
import { ReactComponent as ArrowUpIcon } from '../common/images/icons/arrow-up.svg';
import { ReactComponent as ExternalLinkIcon } from '../common/images/icons/external-link.svg';
import { ReactComponent as TrashCanIcon } from '../common/images/icons/trash-can.svg';

import { EVENT_REPORT_CATEGORY, trackEventFactory } from '../utils/analytics';
import { getElementPositionDataWithinScrollContainer } from '../utils/layout';
import { getHoursAndMinutesString } from '../utils/datetime';
import { uuid } from '../utils/string';

import DatePicker from '../DatePicker';
import Select from '../Select';
import TimePicker from '../TimePicker';

import styles from './styles.module.scss';

const eventReportTracker = trackEventFactory(EVENT_REPORT_CATEGORY);

export const AddButton = ({ className, uiSchema: _uiSchema, ...restProps }) => {
  const { t } = useTranslation('components', { keyPrefix: 'schemaFields.addButton' });

  return <Button className={`${className} ${styles.addButton}`} title={t('title')} {...restProps}>
    <AddButtonIcon />

    {t('content')}
  </Button>;
};

export const ArrayFieldItemTemplate = ({
  children,
  disabled,
  hasToolbar,
  hasMoveDown,
  hasMoveUp,
  hasRemove,
  index,
  onDropIndexClick,
  onReorderClick,
  readonly,
  registry,
  uiSchema,
}) => {
  const { MoveDownButton, MoveUpButton, RemoveButton } = registry.templates.ButtonTemplates;

  return <div className={styles.arrayFieldItemTemplate}>
    {children}

    {hasToolbar && <div className={styles.arrayFieldItemButtons}>
      {(hasMoveUp || hasMoveDown) && <MoveUpButton
        disabled={disabled || readonly || !hasMoveUp}
        onClick={onReorderClick(index, index - 1)}
        uiSchema={uiSchema}
      />}

      {(hasMoveUp || hasMoveDown) && <MoveDownButton
        disabled={disabled || readonly || !hasMoveDown}
        onClick={onReorderClick(index, index + 1)}
        uiSchema={uiSchema}
      />}

      {hasRemove && <RemoveButton
        disabled={disabled || readonly}
        onClick={onDropIndexClick(index)}
        uiSchema={uiSchema}
      />}
    </div>}
  </div>;
};

export const ArrayFieldTemplate = ({
  canAdd,
  disabled,
  idSchema,
  uiSchema,
  items,
  onAddClick,
  readonly,
  registry,
  required,
  schema,
  title,
}) => {
  const uiOptions = getUiOptions(uiSchema);

  const ArrayFieldDescriptionTemplate = getTemplate('ArrayFieldDescriptionTemplate', registry, uiOptions);
  const ArrayFieldItemTemplate = getTemplate('ArrayFieldItemTemplate', registry, uiOptions);
  const ArrayFieldTitleTemplate = getTemplate('ArrayFieldTitleTemplate', registry, uiOptions);

  const { ButtonTemplates: { AddButton } } = registry.templates;

  const titleToRender = uiOptions.title?.trim() || title?.trim();
  const descriptionToRender = uiOptions.description?.trim() || schema.description?.trim();

  return <div className={styles.arrayFieldTemplate}>
    {titleToRender && <ArrayFieldTitleTemplate
      idSchema={idSchema}
      registry={registry}
      required={required}
      schema={schema}
      title={titleToRender}
      uiSchema={uiSchema}
    />}

    {descriptionToRender && <ArrayFieldDescriptionTemplate
      description={descriptionToRender}
      idSchema={idSchema}
      registry={registry}
      schema={schema}
      uiSchema={uiSchema}
    />}

    <div>
      {items && items.map(({ key, ...rest }) => <ArrayFieldItemTemplate key={key} {...rest} />)}

      {canAdd && <AddButton
        className="array-item-add"
        disabled={disabled || readonly}
        onClick={onAddClick}
        uiSchema={uiSchema}
      />}
    </div>
  </div>;
};

export const BaseInputTemplate = ({
  autofocus,
  children,
  disabled,
  extraProps,
  id,
  onBlur,
  onChange,
  onFocus,
  options,
  placeholder,
  rawErrors = [],
  readonly,
  required,
  schema,
  type,
  value,
}) => {
  const inputProps = { ...extraProps, ...getInputProps(schema, type, options) };

  const _onChange = ({ target: { value } }) => onChange(value === '' ? options.emptyValue : value);

  const _onBlur = ({ target: { value } }) => onBlur(id, value);

  const _onFocus = ({ target: { value } }) => onFocus(id, value);

  return <>
    <Form.Control
      autoFocus={autofocus}
      className={`${rawErrors.length > 0 ? 'is-invalid' : ''} ${styles.baseInput}`}
      disabled={disabled}
      id={id}
      list={schema.examples ? `examples_${id}` : undefined}
      name={id}
      placeholder={placeholder}
      onBlur={_onBlur}
      onChange={_onChange}
      onFocus={_onFocus}
      readOnly={readonly}
      required={required}
      value={value || value === 0 ? value : ''}
      {...inputProps}
    />

    {children}

    {schema.examples ? <datalist id={`examples_${id}`}>
      {schema.examples
        .concat(schema.default ? ([schema.default]) : [])
        .map((example) => <option key={example} value={example} />)}
    </datalist> : null}
  </>;
};

const IconButton = ({ icon, iconType: _iconType, uiSchema: _uiSchema, variant, ...rest }) => <Button
    {...rest}
    variant={variant || 'light'}
    size="sm"
  >
  {icon}
</Button>;

export const MoveDownButton = (props) => {
  const { t } = useTranslation('components', { keyPrefix: 'schemaFields.moveDownButton' });

  return <IconButton className={styles.moveButton} title={t('title')} icon={<ArrowDownIcon />} {...props} />;
};

export const MoveUpButton = (props) => {
  const { t } = useTranslation('components', { keyPrefix: 'schemaFields.moveUpButton' });

  return <IconButton className={styles.moveButton} title={t('title')} icon={<ArrowUpIcon />} {...props} />;
};

export const RemoveButton = (props) => {
  const { t } = useTranslation('components', { keyPrefix: 'schemaFields.removeButton' });

  return <IconButton
    className={styles.removeButton}
    icon={<TrashCanIcon />}
    title={t('title')}
    variant="danger"
    {...props}
  />;
};

const scrollSelectIntoViewOnMenuOpenIfNecessary = (scrollContainer, element, heightToAdd) => {
  const {
    isAboveFold,
    isBelowFold,
    eTop,
    eBottom,
    cTop,
    cBottom,
  } = getElementPositionDataWithinScrollContainer(scrollContainer, element, heightToAdd);

  if (isAboveFold) {
    scrollContainer.scrollTop -= cTop - eTop;
  } else if (isBelowFold) {
    scrollContainer.scrollTop += eBottom - cBottom;
  }
};

export const SelectWidget = ({
  autofocus,
  disabled,
  id,
  multiple,
  onBlur,
  onChange,
  onFocus,
  options,
  placeholder,
  rawErrors = [],
  readonly,
  registry,
  required,
  schema,
  value,
}) => {
  const { enumOptions } = options;

  const containerRef = useRef(null);
  const selectRef = useRef(null);

  const [isMenuOpen, setMenuOpen] = useState(false);

  const schemaInactiveEnumLowercase = useMemo(
    () => (schema.inactive_enum || []).map((inactiveOption) => inactiveOption.toLowerCase()),
    [schema]
  );

  const getOptionLabel = (option) => {
    const { label, name } = option;
    const value = getOptionValue(option);
    if (label === value && schema.enumNames) {
      if (Array.isArray(schema.enumNames) && schema.enumNames.includes(value)) {
        return value;
      } else if (schema.enumNames[value]) {
        return (schema.enumNames[value]);
      }
    }
    return label || name;
  };

  const getOptionValue = (optionValue) => isPlainObject(optionValue) ? optionValue.value : optionValue;

  const isOptionDisabled = (option) => schemaInactiveEnumLowercase.includes(option.value.toLowerCase());

  const selected = enumOptions.find((item) => value
    ? item.value === (isPlainObject(value) ? value.value : value)
    : null);

  const handleChange = useCallback((update) => onChange(update?.value), [onChange]);

  const onMenuOpen = useCallback(() => {
    setMenuOpen(true);
    setTimeout(() => {
      if (selectRef?.current?.menuListRef && registry.formContext && registry.formContext.scrollContainer) {
        scrollSelectIntoViewOnMenuOpenIfNecessary(
          registry.formContext.scrollContainer,
          containerRef.current,
          selectRef.current.menuListRef.clientHeight
        );
      }
    });
  }, [registry.formContext]);

  const onMenuClose = useCallback(() => {
    setMenuOpen(false);
  }, []);

  const onKeyDown = useCallback((event) => {
    if (event.key === 'Escape' && isMenuOpen) {
      event.stopPropagation();
    }
  }, [isMenuOpen]);

  return <Select
    autoFocus={autofocus}
    className={`${rawErrors.length > 0 ? 'is-invalid' : ''} ${styles.selectWidget}`}
    getOptionLabel={getOptionLabel}
    getOptionValue={getOptionValue}
    id={id}
    isClearable={!readonly}
    isDisabled={disabled}
    isMulti={multiple}
    isOptionDisabled={isOptionDisabled}
    isSearchable={!readonly}
    menuIsOpen={readonly ? false : undefined}
    menuShouldScrollIntoView={true}
    placeholder={placeholder}
    onBlur={onBlur}
    onChange={handleChange}
    onFocus={onFocus}
    onKeyDown={onKeyDown}
    onMenuClose={onMenuClose}
    onMenuOpen={onMenuOpen}
    options={enumOptions}
    ref={selectRef}
    required={required}
    value={selected}
  />;
};

export const DateTimeWidget = ({
  autofocus,
  disabled,
  formData,
  idSchema: { id },
  onBlur,
  onChange,
  onFocus,
  readonly,
  required,
  schema,
}) => {
  const date = useMemo(() => formData ? new Date(formData) : undefined, [formData]);

  const handleDateChange = useCallback((newDate) => onChange(newDate ? newDate.toISOString() : newDate), [onChange]);

  const handleTimeChange = useCallback((newTime) => {
    const newTimeParts = newTime.split(':');
    const updatedDateTime = date ? new Date(date) : new Date();
    updatedDateTime.setHours(newTimeParts[0], newTimeParts[1], '00');

    onChange(updatedDateTime.toISOString());
  }, [date, onChange]);

  return <>
    <label htmlFor={id}>{schema.title}{required ? '*' : ''}</label>

    <div className={styles.dateTimeWidget}>
      <div className={styles.datePicker}>
        <DatePicker
          autoFocus={autofocus}
          disabled={disabled}
          id={id}
          maxDate={new Date((new Date().getFullYear() + 15).toString())}
          minDate={null}
          onBlur={onBlur}
          onChange={handleDateChange}
          onFocus={onFocus}
          readOnly={readonly}
          required={required}
          selected={date}
        />
      </div>

      <TimePicker
        className={styles.timePicker}
        disabled={disabled}
        minutesInterval={15}
        onChange={handleTimeChange}
        readOnly={readonly}
        required={required}
        value={getHoursAndMinutesString(date) || '00:00'}
      />
    </div>
  </>;
};

const selectValue = (value, selected, all) => {
  const at = all.indexOf(value);
  const updated = selected.slice(0, at).concat(value, selected.slice(at));

  return updated.sort((a, b) => all.indexOf(a) > all.indexOf(b));
};

const deselectValue = (value, selected) => selected.filter((v) => v !== value);

export const CheckboxesWidget = ({
  autofocus,
  disabled,
  id,
  onBlur,
  onChange,
  onFocus,
  options,
  readonly,
  schema,
  value,
}) => {
  const { enumOptions, enumDisabled, inline } = options;

  const [originalValues] = useState(value.map((val) => isPlainObject(val) ? val.value : val));

  const filteredEnumOptions = enumOptions.filter((option) => {
    const itemDisabled = schema.inactive_enum && schema.inactive_enum.includes(option.value);

    return !itemDisabled || (!!itemDisabled && !!originalValues.includes(option.value));
  });

  const _onChange = (option) => ({ target: { checked } }) => {
    const all = filteredEnumOptions.map(({ value }) => value);

    if (checked) {
      onChange(selectValue(option.value, value, all));
    } else {
      onChange(deselectValue(option.value, value));
    }
  };

  const _onBlur = ({ target: { value } }) => onBlur(id, value);

  const _onFocus = ({ target: { value } }) => onFocus(id, value);

  return <Form.Group className={styles.checkboxesWidget}>
    {filteredEnumOptions.map((option, index) => {
      const checked = value.indexOf(option.value) !== -1;
      const itemDisabled = Array.isArray(enumDisabled) && enumDisabled.indexOf(option.value) !== -1;

      return <Form.Check
        autoFocus={autofocus && index === 0}
        checked={checked}
        className={styles.checkbox}
        custom
        disabled={disabled || itemDisabled || readonly}
        id={`${id}-${option.value}`}
        inline={inline}
        key={option.value}
        label={option.label}
        name={id}
        onBlur={_onBlur}
        onChange={_onChange(option)}
        onFocus={_onFocus}
        type="checkbox"
      />;
    })}
  </Form.Group>;
};

export const ExternalLinkField = ({ formData, idSchema, schema }) => {
  const onClick = useCallback(() => {
    const urlDomain = formData?.value?.replace('http://', '').replace('https://', '').split(/[/?#:]/g)[0] ?? '';

    eventReportTracker.track('Click \'External Source\' link', urlDomain);
  }, [formData?.value]);

  const value = typeof formData === 'string' ? formData : formData?.value;

  return value && <div className={styles.externalLinkField}>
    <label htmlFor={idSchema.id} data-testid={`schema-link-label-${idSchema.id}`}>
      {schema.title}

      <a onClick={onClick} target='_blank' rel='noopener noreferrer' href={value}>
        <ExternalLinkIcon />
      </a>
    </label>

    <a onClick={onClick} target='_blank' rel='noopener noreferrer' href={value} data-testid={`schema-link-${idSchema.id}`} >{value}</a>
  </div>;
};

const GroupComponent = (props) => props.properties.map((property) => property.children);

const createGroupedFields = ({ instanceId, properties, groups, props }) => {
  if (!Array.isArray(groups)) {
    return properties.map((property) => property.content);
  }

  const mapped = groups.map((group, index) => {
    if (typeof group === 'string') {
      const found = properties.filter((property) => property.name === group);
      if (!!found && found.length === 1) {
        return found[0].content;
      }
      return null;
    } else if (typeof group === 'object') {
      const groupProperties = Object.entries(group).reduce((accumulator, [key, field]) => {
        if (key.startsWith('ui:') || !Array.isArray(field)) {
          return accumulator;
        }
        return [...accumulator, {
          name: key,
          children: createGroupedFields({
            instanceId: `${instanceId}-child-${index}`,
            properties,
            props,
            groups: field
          })
        }];
      }, []);

      return <div className={`fieldset ${group.htmlClass ? group.htmlClass : 'row'}`} key={`${instanceId}-${index}`}>
        {group.title && <legend>{group.title}</legend>}

        <GroupComponent properties={groupProperties} />
      </div>;
    }

    throw new Error('Invalid grouping' + typeof group + ' ' + group);
  });

  return mapped;
};

export const ObjectFieldTemplate = (props) => {
  const {
    description,
    disabled,
    formData,
    idSchema,
    onAddClick,
    properties,
    readonly,
    registry,
    required,
    schema,
    title,
    uiSchema,
  } = props;

  const [instanceId] = useState(uuid());

  const uiOptions = getUiOptions(uiSchema);

  const TitleFieldTemplate = getTemplate('TitleFieldTemplate', registry, uiOptions);
  const DescriptionFieldTemplate = getTemplate('DescriptionFieldTemplate', registry, uiOptions);

  const { ButtonTemplates: { AddButton } } = registry.templates;

  // If it's the whole event type object field schema it will have the icon_id and we don't want to render its title
  const titleToRender = schema.icon_id ? null : uiOptions.title?.trim() || title?.trim();
  const descriptionToRender = uiOptions.description?.trim() || description?.trim();

  return <>
    {titleToRender && <TitleFieldTemplate
      id={`${idSchema.$id}-title`}
      registry={registry}
      required={required}
      schema={schema}
      title={titleToRender}
      uiSchema={uiSchema}
    />}

    {descriptionToRender && <DescriptionFieldTemplate
      description={descriptionToRender}
      id={`${idSchema.$id}-description`}
      registry={registry}
      schema={schema}
      uiSchema={uiSchema}
    />}

    <div className="row">
      {createGroupedFields({
        instanceId,
        props,
        properties: properties,
        groups: uiSchema['ui:groups'],
      })}

      {canExpand(schema, uiSchema, formData)
        ? <AddButton
          className="object-property-expand"
          disabled={disabled || readonly}
          onClick={onAddClick(schema)}
          uiSchema={uiSchema}
        />
        : null}
    </div>
  </>;
};
