import React, { Fragment, useCallback, useEffect, useState, useRef } from 'react';
import Select, { components } from 'react-select';
import DateTimePickerPopover from '../DateTimePickerPopover';
import isString from 'lodash/isString';
import isPlainObject from 'lodash/isPlainObject';
import debounce from 'lodash/debounce';

import { DEFAULT_SELECT_STYLES } from '../constants';
import { trackEvent } from '../utils/analytics';
import { uuid } from '../utils/string';

import { ReactComponent as ExternalLinkIcon } from '../common/images/icons/external-link.svg';

import { getElementPositionDataWithinScrollContainer } from '../utils/layout';

import styles from './styles.module.scss';


const scrollSelectIntoViewOnMenuOpenIfNecessary = (scrollContainer, element, heightToAdd) => {
  const { isAboveFold, isBelowFold, eTop, eBottom, cTop, cBottom } = getElementPositionDataWithinScrollContainer(scrollContainer, element, heightToAdd);

  if (isAboveFold) {
    scrollContainer.scrollTop -= (cTop - eTop);
  } else if (isBelowFold) {
    scrollContainer.scrollTop += (eBottom - cBottom);
  }
};

const SelectField = (props) => {
  console.log('selectfield props', props);
  const { disabled, id, value, placeholder, required, onChange, schema, options: { enumOptions } } = props;
  const selectRef = useRef(null);
  const containerRef = useRef(null);

  const SelectContainer = ({ children, ...props }) => {
    return (
      <div ref={containerRef}> 
        <components.SelectContainer {...props}>
          {children}
        </components.SelectContainer>
      </div>
    );
  };

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
    return (label || name);
  };
  const getOptionValue = (val) => isPlainObject(val) ? val.value : val;
  const isOptionDisabled = (option) => schema.inactive_enum && schema.inactive_enum.includes(option.value.toLowerCase());

  const selected = enumOptions.find((item) => value ?
    item.value ===
    (isPlainObject(value) ?
      value.value : value)
    : null
  );

  const onMenuOpen = useCallback(() => setTimeout(() => {
    if (selectRef.current.select.menuListRef
      && props.registry.formContext
      && props.registry.formContext.scrollContainer
    ) {
      scrollSelectIntoViewOnMenuOpenIfNecessary(props.registry.formContext.scrollContainer, containerRef.current, selectRef.current.select.menuListRef.clientHeight);
    }
  }), [props.registry.formContext]);

  const handleChange = useCallback((update) => {
    if (!update) return onChange(update);

    const { value } = update;
    return onChange(value);
  }, [onChange]);

  return <Select
    components={{SelectContainer}}
    isDisabled={disabled}
    id={id}
    ref={selectRef}
    required={required}
    value={selected}
    options={enumOptions}
    placeholder={placeholder}
    isClearable={true}
    onMenuOpen={onMenuOpen}
    isSearchable={true}
    menuShouldScrollIntoView={true}
    getOptionLabel={getOptionLabel}
    getOptionValue={getOptionValue}
    isOptionDisabled={isOptionDisabled}
    onChange={handleChange}
    styles={DEFAULT_SELECT_STYLES}
  />;
};

const calcPlacementForFixedDateTimeField = (scrollContainer, element) => {
  const { eBottom, cBottom } = getElementPositionDataWithinScrollContainer(scrollContainer, element, 0);
  const { left, top } = element.getBoundingClientRect();

  const placement = cBottom - eBottom > 200 ? 'bottom' : 'top';

  const offsets = {
    left,
    top: placement === 'bottom' ? top + 60 : top - 400,
  };

  return {
    offsets, placement,
  };
};


const DateTimeField = (props) => {
  const { disabled, idSchema: { id }, schema: { title: label }, onChange, required, maxDate, formData } = props;
  const labelRef = useRef(null);
  const [localCss, setStyles] = useState({ display: 'none' });
  const [popoverOpen, setPopoverState] = useState(false);
  const [placement, setPlacement] = useState('bottom');

  const onPopoverToggle = useCallback((state) => {
    setPopoverState(state);
  }, []);

  const scrollEventRef = useRef(null);

  useEffect(() => {
    if (!!props.registry.formContext.scrollContainer && !!popoverOpen) {

      if (scrollEventRef.current) {
        scrollEventRef.current.cancel();
        window.removeEventListener('resize', scrollEventRef.current);
        props.registry.formContext.scrollContainer.removeEventListener('scroll', scrollEventRef.current);
      }

      scrollEventRef.current = debounce(() => {
        if (!labelRef || !labelRef.current || !popoverOpen) return null;

        if (
          !!props.registry.formContext.scrollContainer
          && !getElementPositionDataWithinScrollContainer(props.registry.formContext.scrollContainer, labelRef.current, 0)
            .isFullyVisible) {
          return setPopoverState(false);
        }

        const { offsets, placement:newPlacement } = calcPlacementForFixedDateTimeField(props.registry.formContext.scrollContainer, labelRef.current);

        if (placement !== newPlacement) {
          setPlacement(newPlacement);
        }

        setStyles({
          display: 'block',
          transform: `translate(${offsets.left}px, ${offsets.top}px)`,
        });
      }, 100);

      window.addEventListener('resize', scrollEventRef.current);
      props.registry.formContext.scrollContainer.addEventListener('scroll', scrollEventRef.current);
    }

    return () => {
      if (!!props.registry.formContext.scrollContainer && !!scrollEventRef.current) {
        window.removeEventListener('resize', scrollEventRef.current);
        props.registry.formContext.scrollContainer.removeEventListener('scroll', scrollEventRef.current); /* eslint-disable-line */
      }
    };

  }, [localCss, placement, popoverOpen, props.registry.formContext.scrollContainer]);

  const date = formData ? new Date(formData) : undefined;

  const handleChange = useCallback((newVal) => {
    onChange(newVal ? newVal.toISOString() : newVal);
  }, [onChange]);

  useEffect(() =>{
    if (!!popoverOpen) {
      scrollEventRef.current();
    }
  }, [popoverOpen]);

  return <Fragment>
    <label ref={labelRef} htmlFor={id}>{label}{required ? '*' : ''}</label>
    <DateTimePickerPopover disabled={disabled} placement={placement} popoverClassName={styles.datepicker} popoverStyles={localCss}
      id={id} required={required}  maxDate={maxDate || new Date('2050')} value={date} popoverOpen={popoverOpen} onPopoverToggle={onPopoverToggle}
      onChange={handleChange} defaultTimeValue='00:00' />
  </Fragment>;
};

const CustomCheckboxes = (props) => {
  console.log('CustomCheckboxes props', props);
  const { id, disabled, options, value = [], autofocus, readonly, onChange, schema } = props;
  const { enumOptions, inline } = options;
  const [instanceId] = useState(uuid());
  const [originalValues] = useState(
    value.map(val => {
      if (isPlainObject(val)) return val.value;
      return val;
    })
  );

  const inputValues = value.map(val => {
    if (isPlainObject(val)) return val.value;
    return val;
  });

  useEffect(() => {
    setTimeout(() => {
      if (value.some(v => !isString(v))) {
        onChange(inputValues);
      }
    });
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  const enumOptionIsChecked = option => inputValues.includes(option.value);

  return (
    <div className='json-schema-checkbox-wrapper checkboxes' id={id}>
      {enumOptions
        .filter((option) => {
          const itemDisabled =
          schema.inactive_enum && schema.inactive_enum.includes(option.value);
          
          return !itemDisabled || 
          (!!itemDisabled && !!originalValues.includes(option.value));
        })
        .map((option, index) => {
        
          const disabledCls =
          (disabled || readonly) ? 'disabled' : '';
          const inputId = `${id}_${instanceId}_${index}`;
          const checkbox =  <span>
            <input
              type='checkbox'
              id={inputId}
              checked={enumOptionIsChecked(option)}
              disabled={disabled || readonly}
              autoFocus={autofocus && index === 0}
              onChange={event => {
                if (enumOptionIsChecked(option)) {
                  onChange(inputValues.filter(item => item !== option.value));
                } else {
                  onChange([...inputValues, option.value]);
                }
              }}
            />
            <span>{option.label}</span>
          </span>;
          return inline ? (
            <label htmlFor={inputId} key={index} className={`checkbox-inline ${disabledCls}`}>
              {checkbox}
            </label>
          ) : (
            <div key={index} className={`checkbox ${disabledCls}`}>
              <label htmlFor={inputId}>{checkbox}</label>
            </div>
          );
        })}
    </div>
  );
};


const ExternalLink = (props) => {
  console.log('ExternalLink props', props);
  const { idSchema: { id }, schema: { title: label }, formData: value } = props;

  const onLinkClick = () => {
    trackEvent(
      'Event Report',
      'Click \'External Source\' link',
      value.replace('http://', '').replace('https://', '').split(/[/?#:]/g)[0]
    );
  };

  return <div>
    <label className={styles.linkLabel} htmlFor={id}>{label}
      <a onClick={onLinkClick} target='_blank' rel='noopener noreferrer' href={value}>
        <ExternalLinkIcon />
      </a>
    </label>
    <a onClick={onLinkClick} target='_blank' rel='noopener noreferrer' href={value}>{value}</a>
  </div>;
};

export default {
  select: SelectField,
  checkboxes: CustomCheckboxes,
  datetime: DateTimeField,
  externalUri: ExternalLink,
};

export const ObjectFieldTemplate = (props) => {
  const { TitleField, DescriptionField } = props;

  const [instanceId] = useState(uuid());

  return <div className='container' style={{padding: 0}}>
    {(props.title || props.uiSchema['ui:title']) && (
      <TitleField
        id={`${props.idSchema.$id}__title`}
        title={props.title || props.uiSchema['ui:title']}
        required={props.required}
        formContext={props.formContext}
      />
    )}
    {props.description && (
      <DescriptionField
        id={`${props.idSchema.$id}__description`}
        description={props.description}
        formContext={props.formContext}
      />
    )}
    <div className='row'>

      {createGroupedFields({
        instanceId,
        props,
        properties: props.properties,
        groups: props.uiSchema['ui:groups'],
      })}
    </div>
  </div>;
};

const GroupComponent = props => props.properties.map((p) => p.children);

const createGroupedFields = ({ instanceId, properties, groups, props }) => {
  if (!Array.isArray(groups)) {
    return properties.map(p => p.content);
  }
  const mapped = groups.map((g, index) => {
    if (typeof g === 'string') {
      const found = properties.filter(p => p.name === g);
      if (!!found && found.length === 1) {
        const el = found[0];
        return el.content;
      }
      return null;
    } else if (typeof g === 'object') {
      
      const _properties = Object.entries(g).reduce((acc, [key, field]) => {
        if (key.startsWith('ui:') 
        || !Array.isArray(field)) {
          return acc;
        }
        return [
          ...acc,
          {
            name: key,
            children: createGroupedFields({
              instanceId: `${instanceId}-child-${index}`,
              properties,
              props,
              groups: field
            })
          }
        ];
      }, []);
      return <div key={`${instanceId}-${index}`} className={`fieldset ${g.htmlClass ? g.htmlClass : 'row'}`}>
        {g.title && <legend>{g.title}</legend>}
        <GroupComponent properties={_properties} />
      </div>;
    }
    throw new Error('Invalid grouping' + typeof g + ' ' + g);
  });
  return mapped;
};