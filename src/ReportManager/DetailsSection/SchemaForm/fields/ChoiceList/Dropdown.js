import React, { useMemo, useState } from 'react';
import Select, { components } from 'react-select';
import { useTranslation } from 'react-i18next';

import { ReactComponent as CheckIcon } from '../../../../../common/images/icons/check-light.svg';

import * as styles from './styles.module.scss';

const IndicatorSeparator = () => null;

const Option = ({ data, innerProps, isSelected, isMulti, ...restProps }) => <components.Option
    data={data}
    innerProps={{ ...innerProps, title: data.label }}
    isMulti={isMulti}
    {...restProps}
  >
  {isSelected && !isMulti && <CheckIcon className={styles.checkMark} />}

  <span className={`${styles.optionLabel} ${ !isMulti && !isSelected && styles.singleOption }`}>
    {data.label}
  </span>
</components.Option>;

const Dropdown = ({ details, disabled, id, invalid, onChange, value, ...otherProps }) => {
  const { t } = useTranslation('components', { keyPrefix: 'choiceList' });

  const [isMenuOpen, setMenuOpen] = useState(false);

  const options = useMemo(
    () => details.options.map((option) => ({ label: option.title, value: option.const })),
    [details.options]
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
      control: (state) => `${styles.control} ${ invalid ? styles.dropdownError : '' } ${ state.isFocused ? styles.controlFocused : '' }`,
      dropdownIndicator: () => styles.cursorPointer,
      indicatorsContainer: () => invalid && styles.caretError,
      multiValue: () => styles.multiValue,
      multiValueRemove: () => styles.multiValueRemove,
      option: () => styles.cursorPointer,
      placeholder: () => invalid && styles.error,
    }}
    components={{ IndicatorSeparator, Option }}
    inputId={id}
    isClearable
    isDisabled={disabled}
    isMulti={details.multiple}
    noOptionsMessage={() => t('select.noOptionsMessage')}
    onChange={onSelectChange}
    onKeyDown={(event) => event.key === 'Escape' && isMenuOpen && event.stopPropagation()}
    onMenuClose={() => setMenuOpen(false)}
    onMenuOpen={() => setMenuOpen(true)}
    options={options}
    placeholder={details.hint}
    value={selectedValue}
    {...otherProps}
  />;
};

export default Dropdown;
