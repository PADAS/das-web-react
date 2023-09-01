import React, { forwardRef, memo, useMemo } from 'react';
import ReactSelect, { components } from 'react-select';

import colorVars from '../common/styles/vars/colors.module.scss';
import controlsVars from '../common/styles/vars/controls.module.scss';

import styles from './styles.module.scss';

const DropdownIndicator = ({ isDisabled, ...restProps }) => <components.DropdownIndicator isDisabled={isDisabled} {...restProps}>
  <div className={ !isDisabled ? styles.caret : styles.disabled } />
</components.DropdownIndicator>;

const Select = ({ styles: customStyles, components, ...rest }, ref) => {
  const selectStyles = useMemo(() => ({
    ...customStyles,
    option: (styles, state) => {
      const { isDisabled, isFocused } = state;
      return {
        ...styles,
        backgroundColor: isFocused ? colorVars.optionHighlight : 'white',
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
      components={{ DropdownIndicator, ...components }}
      ref={ref}
      styles={selectStyles}
      {...rest}
  />;
};

const SelectForwardRef = forwardRef(Select);

export default memo(SelectForwardRef);
