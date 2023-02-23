import React, { memo, useMemo } from 'react';
import ReactSelect, { components } from 'react-select';
import styles from './styles.module.scss';
import colorVars from '../common/styles/vars/colors.module.scss';
import controlsVars from '../common/styles/vars/controls.module.scss';

const DropdownIndicator = (props) => {
  return (
    <components.DropdownIndicator {...props}>
      <div className={styles.caret} />
    </components.DropdownIndicator>
  );
};

const Select = ({ styles: customStyles, components, ...otherProps }) => {

  const selectStyles = useMemo(() => ({
    ...customStyles,
    option(styles, state) {
      const { isDisabled, isFocused } = state;
      return {
        ...styles,
        backgroundColor: isFocused ? colorVars.optionHighlight : 'white',
        color: 'inherit',
        display: isDisabled ? 'none' : 'block',
        cursor: isFocused ? 'pointer' : 'inherit',
      };
    },
    menu(styles) {
      return {
        ...styles,
        zIndex: 10,
        boxShadow: controlsVars.baseBoxShadow,
      };
    },
    placeholder(styles){
      return {
        ...styles,
        fontWeight: 'normal'
      };
    }
  }), [customStyles]);

  return <ReactSelect
      components={{ ...components, DropdownIndicator }}
      styles={selectStyles}
      {...otherProps}
  />;
};

export default memo(Select);