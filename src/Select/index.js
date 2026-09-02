import React, { memo, useCallback, useLayoutEffect, useMemo, useRef } from 'react';
import ReactSelect, { components } from 'react-select';
import { useTranslation } from 'react-i18next';

import { ReactComponent as CheckIcon } from '../common/images/icons/check-light.svg';

import { BOOTSTRAP_DEFAULTS } from '../constants';

import * as styles from './styles.module.scss';

const IndicatorSeparator = () => null;

// This list scrolls itself and hands back the scroll react-select is still
// holding.
const MenuList = ({ innerRef, maxHeight, selectProps, ...otherProps }) => {
  const menuListRef = useRef(null);

  const onFocusedOptionScrolled = selectProps.onFocusedOptionScrolled;

  const setMenuListRef = useCallback((menuList) => {
    menuListRef.current = menuList;

    innerRef?.(menuList);
  }, [innerRef]);

  // The height the menu settles on comes from measuring where it fits.
  useLayoutEffect(() => {
    const menuList = menuListRef.current;
    const focusedOption = menuList?.querySelector(`.${styles.optionFocused}`);

    if (focusedOption) {
      const isFocusedOptionInView = focusedOption.offsetTop >= menuList.scrollTop
        && focusedOption.offsetTop + focusedOption.offsetHeight <= menuList.scrollTop + menuList.clientHeight;

      if (!isFocusedOptionInView) {
        menuList.scrollTop = focusedOption.offsetTop - (menuList.clientHeight - focusedOption.offsetHeight) / 2;
      }
    }

    onFocusedOptionScrolled();
  }, [maxHeight, onFocusedOptionScrolled]);

  return <components.MenuList
    innerRef={setMenuListRef}
    maxHeight={maxHeight}
    selectProps={selectProps}
    {...otherProps}
  />;
};

const Option = ({ children, className = '', innerProps, isMulti, isSelected, ...otherProps }) => <components.Option
    className={`${className} ${styles.option}`}
    innerProps={{ ...innerProps, 'aria-selected': isSelected }}
    isMulti={isMulti}
    isSelected={isSelected}
    {...otherProps}
  >
  {!isMulti && (isSelected
    ? <CheckIcon aria-hidden="true" className={styles.checkMark} />
    : <span aria-hidden="true" className={styles.checkMarkPlaceholder} />)}

  {children}
</components.Option>;

const getDefaultOptionLabel = ({ label }) => label;
const getDefaultOptionValue = ({ value }) => value;

const renderOptionLabel = (option, renderOptionIcon, getOptionLabel) => <span className={styles.optionLabel}>
  <span className={styles.optionIcon}>{renderOptionIcon(option)}</span>

  {getOptionLabel(option)}
</span>;

const resolveValueFromOptions = (value, options, getOptionValue) => {
  if (!value || options.length === 0) {
    return value;
  }

  const optionsByValue = new Map(options
    .flatMap((option) => option.options ?? option)
    .map((option) => [getOptionValue(option), option]));

  const resolveOption = (selectedOption) => optionsByValue.get(getOptionValue(selectedOption)) ?? selectedOption;

  if (!Array.isArray(value)) {
    return resolveOption(value);
  }

  const resolvedValue = value.map(resolveOption);

  return resolvedValue.every((option, index) => option === value[index]) ? value : resolvedValue;
};

const Select = ({
  classNames: customClassNames,
  components: customComponents,
  options = [],
  renderOptionIcon,
  styles: customStyles,
  value,
  ...otherProps
}) => {
  const { t } = useTranslation('components', { keyPrefix: 'select' });

  const selectRef = useRef(null);

  const getOptionLabel = otherProps.getOptionLabel ?? getDefaultOptionLabel;
  const getOptionValue = otherProps.getOptionValue ?? getDefaultOptionValue;

  const resolvedValue = useMemo(
    () => resolveValueFromOptions(value, options, getOptionValue),
    [getOptionValue, options, value]
  );

  const onFocusedOptionScrolled = useCallback(() => {
    if (selectRef.current) {
      selectRef.current.scrollToFocusedOptionOnUpdate = false;
    }
  }, []);

  const shouldRenderOptionIcon = (context) => !!renderOptionIcon
    && (context === 'menu' || !otherProps.isMulti);

  return <ReactSelect
    classNames={{
      clearIndicator: () => styles.cursorPointer,
      control: (state) => `${styles.control} ${state.isFocused ? styles.controlFocused : ''}`,
      dropdownIndicator: () => styles.cursorPointer,
      indicatorsContainer: () => styles.indicatorsContainer,
      input: () => shouldRenderOptionIcon('value') ? styles.inputWithOptionIcon : '',
      multiValue: () => styles.multiValue,
      multiValueRemove: () => styles.multiValueRemove,
      noOptionsMessage: () => styles.noOptionsMessage,
      option: (state) => `${styles.cursorPointer} ${state.isFocused ? styles.optionFocused : ''}`,
      ...customClassNames,
    }}
    components={{ IndicatorSeparator, MenuList, Option, ...customComponents }}
    formatOptionLabel={renderOptionIcon
      ? (option, { context }) => (shouldRenderOptionIcon(context)
        ? renderOptionLabel(option, renderOptionIcon, getOptionLabel)
        : getOptionLabel(option))
      : undefined}
    isClearable
    menuPlacement="auto"
    menuPortalTarget={document.body}
    noOptionsMessage={() => t('noOptionsMessage')}
    onFocusedOptionScrolled={onFocusedOptionScrolled}
    options={options}
    placeholder=""
    ref={selectRef}
    styles={{ menuPortal: (base) => ({ ...base, zIndex: BOOTSTRAP_DEFAULTS.MODAL_ZINDEX + 1 }), ...customStyles }}
    value={resolvedValue}
    {...otherProps}
  />;
};

export default memo(Select);
