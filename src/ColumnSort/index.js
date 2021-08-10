import React, { useState } from 'react';
import Dropdown from 'react-bootstrap/Dropdown';

import styles from './styles.module.scss';

const { Toggle, Menu, Item } = Dropdown;

const ColumnSort = (props) => {

  const { options, value, onChange } = props;

  const [open, setOpen] = useState(false);

  const [direction, selectedOption] = value;

  const onDropdownToggle = () => setOpen(!open);

  const toggleSortDirection = () => {
    const newDir = direction === '+' ? '-' : '+';

    onChange([newDir, selectedOption]);
  };

  const onClickSortOption = (option) => {
    onChange([direction, option]);
  };

  const sortDirectionCharacter = direction === '+' ? '▲' : '▼';

  return <Dropdown onToggle={onDropdownToggle} size="sm">
    <span className={styles.toggleWrapper}>
      <Toggle data-testid='sort-header'>
        <span>{selectedOption.label} </span>
      </Toggle>
      <span data-testid='sort-direction-toggle' onClick={toggleSortDirection}>{sortDirectionCharacter}</span>
    </span>
    <Menu data-testid='sort-options'>
      {
        options.map(option => <Item key={option.value} onClick={() => onClickSortOption(option)}>{option.label}</Item>)
      }
    </Menu>
  </Dropdown>;
};

export default ColumnSort;