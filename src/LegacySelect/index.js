import { useMemo } from 'react';
import ReactSelect, { components } from 'react-select';

import { themeReactSelect } from '../utils/colors';

import * as controlsVars from '../common/styles/vars/controls.module.scss';

import * as styles from './styles.module.scss';

const DropdownIndicator = ({ isDisabled, ...restProps }) => <components.DropdownIndicator isDisabled={isDisabled} {...restProps}>
  <div className={ !isDisabled ? styles.caret : styles.disabled } />
</components.DropdownIndicator>;

const IndicatorsContainer = ({ className, ...rest }) => <components.IndicatorsContainer
  className={`${styles.indicatorsContainer} ${className}`}
  {...rest}
/>;

const LegacySelect = ({ styles: customStyles, components, ref, ...rest }) => {
  const selectStyles = useMemo(() => ({
    ...customStyles,
    option: (styles, state) => {
      const { isDisabled, isFocused, isSelected } = state;
      const restingBackgroundColor = isSelected
        ? 'var(--er-ui-background-selected-background)'
        : 'var(--er-ui-background-primary-background)';
      return {
        ...styles,
        backgroundColor: isFocused ? 'var(--er-ui-background-hover-background)' : restingBackgroundColor,
        color: 'inherit',
        display: isDisabled ? 'none' : 'block',
        cursor: isFocused ? 'pointer' : 'inherit',
      };
    },
    menu: (styles) => {
      return {
        ...styles,
        zIndex: 10,
        boxShadow: controlsVars.baseBoxShadow,
      };
    },
    placeholder: (styles) => {
      return {
        ...styles,
        fontWeight: 'normal'
      };
    }
  }), [customStyles]);

  return <ReactSelect
      components={{ DropdownIndicator, IndicatorsContainer, ...components }}
      ref={ref}
      styles={selectStyles}
      theme={themeReactSelect}
      {...rest}
  />;
};

export default LegacySelect;
