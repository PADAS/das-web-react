import React, { useCallback, useMemo, useRef, useState } from 'react';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import { canExpand, getInputProps, getTemplate, getUiOptions } from '@rjsf/utils';
import isPlainObject from 'lodash/isPlainObject';
import Select, { components } from 'react-select';

import { ReactComponent as AddButtonIcon } from '../common/images/icons/add_button.svg';
import { ReactComponent as ArrowDownIcon } from '../common/images/icons/arrow-down.svg';
import { ReactComponent as ArrowUpIcon } from '../common/images/icons/arrow-up.svg';
import { ReactComponent as ExternalLinkIcon } from '../common/images/icons/external-link.svg';
import { ReactComponent as TrashCanIcon } from '../common/images/icons/trash-can.svg';

import { DATEPICKER_DEFAULT_CONFIG, DEFAULT_SELECT_STYLES } from '../constants';
import { EVENT_REPORT_CATEGORY, trackEventFactory } from '../utils/analytics';
import { getElementPositionDataWithinScrollContainer } from '../utils/layout';
import { uuid } from '../utils/string';

import DatePicker from '../DatePicker';

import styles from './styles.module.scss';

const eventReportTracker = trackEventFactory(EVENT_REPORT_CATEGORY);

export const AddButton = ({ className, uiSchema: _uiSchema, ...rest }) => (
  <Button className={`${className} ${styles.addButton}`} title="Add Item" {...rest}>
    <AddButtonIcon />
    New
  </Button>
);

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

const IconButton = ({ icon, iconType, uiSchema: _uiSchema, variant, ...rest }) => <Button
    {...rest}
    block={iconType === 'block'}
    variant={variant || 'light'}
    size="sm"
  >
  {icon}
</Button>;

export const MoveDownButton = (props) => <IconButton
  className={styles.moveButton}
  title="Move down"
  icon={<ArrowDownIcon />}
  {...props}
/>;

export const MoveUpButton = (props) => <IconButton
  className={styles.moveButton}
  title="Move up"
  icon={<ArrowUpIcon />}
  {...props}
/>;

export const RemoveButton = (props) => <IconButton
  className={styles.removeButton}
  icon={<TrashCanIcon />}
  title="Remove"
  variant="danger"
  {...props}
/>;

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

  const SelectContainer = (props) => <div ref={containerRef}>
    <components.SelectContainer {...props} />
  </div>;

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

  const onMenuOpen = useCallback(() => setTimeout(() => {
    if (selectRef.current.select.menuListRef && registry.formContext && registry.formContext.scrollContainer) {
      scrollSelectIntoViewOnMenuOpenIfNecessary(
        registry.formContext.scrollContainer,
        containerRef.current,
        selectRef.current.select.menuListRef.clientHeight
      );
    }
  }), [registry.formContext]);

  return <Select
    autoFocus={autofocus}
    className={`${rawErrors.length > 0 ? 'is-invalid' : ''} ${styles.selectWidget}`}
    components={{ SelectContainer }}
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
    onMenuOpen={onMenuOpen}
    options={enumOptions}
    ref={selectRef}
    required={required}
    styles={DEFAULT_SELECT_STYLES}
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
  const date = formData ? new Date(formData) : undefined;

  const handleChange = useCallback((newVal) => onChange(newVal ? newVal.toISOString() : newVal), [onChange]);

  return <>
    <label htmlFor={id}>{schema.title}{required ? '*' : ''}</label>

    <DatePicker
      {...DATEPICKER_DEFAULT_CONFIG}
      autoFocus={autofocus}
      className={styles.dateTimeWidget}
      defaultTimeValue='00:00'
      disabled={disabled}
      id={id}
      maxDate={new Date((new Date().getFullYear() + 15).toString())}
      minDate={null}
      onBlur={onBlur}
      onChange={handleChange}
      onFocus={onFocus}
      readOnly={readonly}
      required={required}
      showTimeInput
      value={date}
    />
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
    const urlDomain = formData.value.replace('http://', '').replace('https://', '').split(/[/?#:]/g)[0];

    eventReportTracker.track('Click \'External Source\' link', urlDomain);
  }, [formData.value]);

  return <div className={styles.externalLinkField}>
    <label htmlFor={idSchema.id}>
      {schema.title}

      <a onClick={onClick} target='_blank' rel='noopener noreferrer' href={formData.value}>
        <ExternalLinkIcon />
      </a>
    </label>

    <a onClick={onClick} target='_blank' rel='noopener noreferrer' href={formData.value}>{formData.value}</a>
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
