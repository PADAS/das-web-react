import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import ReactSelect, { components as SelectComponent } from 'react-select';

import { ReactComponent as CheckIcon } from '../../../../../common/images/icons/check-light.svg';

import styles from '../styles.module.scss';

const Option = ({ data, isSelected, isMulti, ...restProps }) => <div>
  <SelectComponent.Option data={data} isMulti={isMulti} {...restProps}>
    {
            isSelected && !isMulti && <CheckIcon className={styles.checkMark} />
        }
    <span className={`${styles.optionLabel} ${ !isMulti && !isSelected && styles.singleOption }`} title={data.title}>
      {data.title}
    </span>
  </SelectComponent.Option>
</div>;


const Dropdown = ({ details, onChange, value, id, hasError, disabled, ...otherProps }) => {

  const [isMenuOpen, setMenuOpen] = useState(false);
  const { t } = useTranslation('components', { keyPrefix: 'choiceList' });

  const selectedValue = details.multiple ? value : details.options.find((item) => item.const === value);

  const handleOnChange = (newValue) => {
    if ( ( details.multiple && newValue.length === 0 ) || !newValue){
      return onChange(undefined);
    }
    const returnedValue = details.multiple ? newValue.map((item) => item.const ?? item) : newValue.const;
    return onChange( returnedValue );
  };

  const onMenuClose = () => setMenuOpen(false);

  const onMenuOpen = () => setMenuOpen(true);

  const onKeyDown = (event) => {
    if (event.key === 'Escape' && isMenuOpen) {
      event.stopPropagation();
    }
  };

  return <ReactSelect
        components={{ Option }}
        classNames={{
            clearIndicator: () => styles.clearIndicator,
            container: () => styles.container,
            control: (state) => `${styles.control} ${ hasError ? styles.dropdownError : '' } ${ state.isFocused ? styles.controlFocused : '' }`,
            dropdownIndicator: () => styles.cursorPointer,
            indicatorsContainer: () => hasError && styles.caretError,
            indicatorSeparator: () => styles.separator,
            multiValue: () => styles.multiValue,
            multiValueRemove: () => styles.multiValueRemove,
            option: () => styles.cursorPointer,
            placeholder: () => hasError && styles.error,
        }}
        getOptionLabel={(option) => option.title ?? details.options.find((item) => item.const === option).title}
        getOptionValue={(option) => option.const ?? option}
        isClearable
        isDisabled={disabled}
        inputId={id}
        isMulti={details.multiple}
        isSearchable
        onChange={handleOnChange}
        noOptionsMessage={() => t('select.noOptionsMessage')}
        options={details.options}
        onMenuClose={onMenuClose}
        onMenuOpen={onMenuOpen}
        onKeyDown={onKeyDown}
        placeholder={details.hint}
        value={selectedValue}
        {...otherProps}
    />;
};

export default Dropdown;
