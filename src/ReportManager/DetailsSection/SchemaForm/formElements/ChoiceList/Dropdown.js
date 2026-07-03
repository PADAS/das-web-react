import React, { useMemo, useState } from 'react';
import Select, { components } from 'react-select';
import { useTranslation } from 'react-i18next';

import { ReactComponent as CheckIcon } from '../../../../../common/images/icons/check-light.svg';

import { BOOTSTRAP_DEFAULTS } from '../../../../../constants';
import getDisplayableChoiceListOptions from '../../../../../utils/v2-event-schemas/getDisplayableChoiceListOptions';

import * as styles from './styles.module.scss';

const IndicatorSeparator = () => null;

const Input = ({ selectProps, ...otherProps }) => <components.Input
  selectProps={selectProps}
  {...otherProps}
  aria-describedby={selectProps['aria-describedby']}
  aria-required={selectProps['aria-required']}
/>;

const Option = ({ className = '', data, innerProps, isSelected, isMulti, ...restProps }) => <components.Option
    className={`${className} ${styles.option}`}
    data={data}
    innerProps={{ ...innerProps, title: data.label }}
    isMulti={isMulti}
    {...restProps}
  >
  {isSelected && !isMulti && <CheckIcon className={styles.checkMark} />}

  <div className={`${styles.optionLabel} ${ !isMulti && !isSelected && styles.singleOption }`}>
    <span className={styles.display} title={data.label}>{data.label}</span>

    {data.description && <span className={styles.description} title={data.description}>{data.description}</span>}
  </div>
</components.Option>;

const Dropdown = ({ details, disabled, id, invalid, onChange, readOnly, value, ...otherProps }) => {
  const { i18n, t } = useTranslation('components', { keyPrefix: 'choiceList' });

  const [isMenuOpen, setMenuOpen] = useState(false);

  const options = useMemo(
    () => getDisplayableChoiceListOptions(details.options, i18n.language)
      .map((option) => ({
        description: option.description,
        label: option.display,
        value: option.value,
      })),
    [details.options, i18n.language]
  );

  const selectedValue = useMemo(
    () => details.multiple
      ? options.filter((option) => value.includes(option.value))
      : options.find((item) => item.value === value),
    [details.multiple, options, value]
  );

  const onSelectChange = (newValue) => {
    const isValueEmpty = details.multiple ? newValue.length === 0 : !newValue;
    if (isValueEmpty) {
      return onChange(undefined);
    }

    return onChange(details.multiple ? newValue.map((option) => option.value) : newValue.value);
  };

  return <Select
    classNames={{
      clearIndicator: () => styles.clearIndicator,
      container: () => styles.container,
      control: (state) => styles.control
        + (invalid ? ` ${styles.dropdownError}` : '')
        + (state.isFocused ? ` ${styles.controlFocused}` : '')
        + (readOnly ? ` ${styles.readOnly}` : ''),
      dropdownIndicator: readOnly ? undefined : () => styles.cursorPointer,
      indicatorsContainer: () => styles.indicatorContainer
        + (invalid ? ` ${styles.caretError}` : '')
        + (readOnly ? ` ${styles.readOnly}` : ''),
      multiValue: () => styles.multiValue,
      multiValueRemove: () => `${styles.multiValueRemove} ${readOnly ? styles.readOnly : ''}`,
      option: readOnly ? undefined : () => styles.cursorPointer,
      placeholder: () => invalid && styles.error,
    }}
    components={{ IndicatorSeparator, Input, Option }}
    inputId={id}
    isClearable={!readOnly}
    isDisabled={disabled}
    isMulti={details.multiple}
    isSearchable={!readOnly}
    menuIsOpen={readOnly ? false : undefined}
    menuPlacement="auto"
    menuPortalTarget={document.body}
    menuShouldScrollIntoView
    noOptionsMessage={() => t('select.noOptionsMessage')}
    onChange={readOnly ? undefined : onSelectChange}
    onKeyDown={(event) => event.key === 'Escape' && isMenuOpen && event.stopPropagation()}
    onMenuClose={() => setMenuOpen(false)}
    onMenuOpen={() => setMenuOpen(true)}
    options={options}
    placeholder={details.hint}
    styles={{ menuPortal: (base) => ({ ...base, zIndex: BOOTSTRAP_DEFAULTS.MODAL_ZINDEX + 1 }) }}
    value={selectedValue}
    {...otherProps}
  />;
};

export default Dropdown;
