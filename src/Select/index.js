import React, { useMemo } from 'react';
import ReactSelect, { components } from 'react-select';

import * as colorVars from '../common/styles/vars/colors.module.scss';
import * as controlsVars from '../common/styles/vars/controls.module.scss';

import * as styles from './styles.module.scss';

const DropdownIndicator = ({ isDisabled, ...restProps }) => <components.DropdownIndicator isDisabled={isDisabled} {...restProps}>
  <div className={ !isDisabled ? styles.caret : styles.disabled } />
</components.DropdownIndicator>;

const IndicatorsContainer = ({ className, ...rest }) => <components.IndicatorsContainer
  className={`${styles.indicatorsContainer} ${className}`}
  {...rest}
/>;

const Select = ({ styles: customStyles, components, ref, ...rest }) => {
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
      components={{ DropdownIndicator, IndicatorsContainer, ...components }}
      menuPortalTarget={document.body}
      menuPlacement='auto'
      ref={ref}
      styles={{
        ...selectStyles,
        menuPortal: base => ({ ...base, zIndex: 10 })
      }}
      {...rest}
  />;
};

export default Select;
