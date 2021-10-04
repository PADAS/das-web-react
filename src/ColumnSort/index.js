import React, { useState } from 'react';
import Button from 'react-bootstrap/Button';
import Dropdown from 'react-bootstrap/Dropdown';

import styles from './styles.module.scss';

const { Header, Toggle, Menu, Item } = Dropdown;

const ColumnSort = (props) => {

  const { className = '', options, value, onChange } = props;

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

  return <span className={styles.columnWrapper}>
    <Dropdown onToggle={onDropdownToggle} className={`${styles.dropdown} ${className}`}>
      <span className={styles.toggleWrapper}>
        <Toggle data-testid='sort-header' size='sm' className={styles.toggle} variant='light'>
          <span>{selectedOption.label} </span>
        </Toggle>
      </span>
      <Menu data-testid='sort-options'>
        <Header className={styles.header}>Sort by:</Header>
        {
          options.map(option => <Item className={styles.listItem} key={option.value} onClick={() => onClickSortOption(option)}>{option.label}</Item>)
        }
      </Menu>
    </Dropdown>
    <Button size='sm' variant='light' className={styles.sortDirection} data-testid='sort-direction-toggle' onClick={toggleSortDirection}>{sortDirectionCharacter}</Button>
  </span>;
};

export default ColumnSort;