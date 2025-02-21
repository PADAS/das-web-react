import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import ReactSelect, { components as SelectComponent } from 'react-select';

import { ReactComponent as CheckIcon } from '../../../../../common/images/icons/check-light.svg';

import styles from './styles.module.scss';

const IndicatorSeparator = () => null;

const Option = ({ data, isSelected, isMulti, ...restProps }) => <div title={data.label}>
  <SelectComponent.Option data={data} isMulti={isMulti} {...restProps}>
    {
        isSelected && !isMulti && <CheckIcon className={styles.checkMark} />
    }
    <span className={`${styles.optionLabel} ${ !isMulti && !isSelected && styles.singleOption }`}>
      {data.label}
    </span>
  </SelectComponent.Option>
</div>;


const Dropdown = ({ details, onChange, value, id, invalid, disabled, ...otherProps }) => {

  const [isMenuOpen, setMenuOpen] = useState(false);
  const { t } = useTranslation('components', { keyPrefix: 'choiceList' });

  const options = details.options.map(({ title, 'const': value }) => ({
    value,
    label: title
  }));

  const selectedValue = details.multiple
    ? options.filter((option) => value.includes(option.value))
    : options.find((item) => item.value === value);

  const handleOnChange = (newValue) => {
    if ( ( details.multiple && newValue.length === 0 ) || !newValue){
      return onChange(undefined);
    }
    const returnedValue = details.multiple ? newValue.map(({ value }) => value) : newValue.value;
    return onChange( returnedValue );
  };

  return <ReactSelect
        components={{ Option, IndicatorSeparator }}
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
        isClearable
        isDisabled={disabled}
        inputId={id}
        isMulti={details.multiple}
        onChange={handleOnChange}
        noOptionsMessage={() => t('select.noOptionsMessage')}
        options={options}
        onMenuClose={() => setMenuOpen(false)}
        onMenuOpen={() => setMenuOpen(true)}
        onKeyDown={(event) => event.key === 'Escape' && isMenuOpen && event.stopPropagation()}
        placeholder={details.hint}
        value={selectedValue}
        {...otherProps}
    />;
};

export default Dropdown;
