import React from 'react';
import ReactSelect, { components } from 'react-select';
import { useTranslation } from 'react-i18next';

import { ReactComponent as CheckIcon } from '../common/images/icons/check-light.svg';

import { BOOTSTRAP_DEFAULTS } from '../constants';

import * as styles from './styles.module.scss';

const IndicatorSeparator = () => null;

const Option = ({ children, className = '', innerProps, isMulti, isSelected, ...otherProps }) => <components.Option
    className={`${className} ${styles.option}`}
    innerProps={innerProps}
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

const renderOptionLabel = (option, renderOptionIcon, getOptionLabel) => <span className={styles.optionLabel}>
  <span className={styles.optionIcon}>{renderOptionIcon(option)}</span>

  {getOptionLabel(option)}
</span>;

const Select = ({
  classNames: customClassNames,
  components: customComponents,
  renderOptionIcon,
  styles: customStyles,
  ...otherProps
}) => {
  const { t } = useTranslation('components', { keyPrefix: 'select' });

  const getOptionLabel = otherProps.getOptionLabel ?? getDefaultOptionLabel;

  return <ReactSelect
    classNames={{
      clearIndicator: () => styles.cursorPointer,
      control: (state) => `${styles.control} ${state.isFocused ? styles.controlFocused : ''}`,
      dropdownIndicator: () => styles.cursorPointer,
      indicatorsContainer: () => styles.indicatorsContainer,
      input: () => renderOptionIcon ? styles.inputWithOptionIcon : '',
      multiValue: () => styles.multiValue,
      multiValueRemove: () => styles.multiValueRemove,
      noOptionsMessage: () => styles.noOptionsMessage,
      option: (state) => `${styles.cursorPointer} ${state.isFocused ? styles.optionFocused : ''}`,
      ...customClassNames,
    }}
    components={{ IndicatorSeparator, Option, ...customComponents }}
    formatOptionLabel={renderOptionIcon
      ? (option) => renderOptionLabel(option, renderOptionIcon, getOptionLabel)
      : undefined}
    isClearable
    menuPlacement="auto"
    menuPortalTarget={document.body}
    menuShouldScrollIntoView
    noOptionsMessage={() => t('noOptionsMessage')}
    placeholder=""
    styles={{ menuPortal: (base) => ({ ...base, zIndex: BOOTSTRAP_DEFAULTS.MODAL_ZINDEX + 1 }), ...customStyles }}
    {...otherProps}
  />;
};

export default Select;
