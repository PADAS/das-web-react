import React, { useState, useEffect } from 'react';
import Button from 'react-bootstrap/Button';
import ListGroup from 'react-bootstrap/ListGroup';
import Popover from 'react-bootstrap/Popover';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import {  DEFAULT_EVENT_SORT } from '../utils/event-filter';

import styles from './styles.module.scss';
import { ReactComponent as ArrowDown } from '../common/images/icons/arrow-down.svg';
import { ReactComponent as ArrowUp } from '../common/images/icons/arrow-up.svg';
import { ReactComponent as SortLines } from '../common/images/icons/sort-lines.svg';
import { ReactComponent as CheckIcon } from '../common/images/icons/check.svg';

const { Title, Content } = Popover;
const { Item } = ListGroup;

const ColumnSort = (props) => {

  const { className = '', sortOptions, orderOptions, value, onChange } = props;
  const [isSortUp, setSortDirection] = useState(value === '+');
  const [direction, selectedOption] = value;
  const isSortModified = !DEFAULT_EVENT_SORT.includes(selectedOption);

  const toggleSortDirection = () => {
    const newDir = direction === '+' ? '-' : '+';

    onChange([newDir, selectedOption]);
  };

  const onClickSortOption = (option) => {
    onChange([direction, option]);
  };

  useEffect(() => {
    setSortDirection(direction === '+');
  }, [direction]);

  const sortDirectionIcon = isSortUp ? <ArrowUp /> : <ArrowDown />;

  const SortPopover = <Popover className={styles.sortPopover} id='sort-popover'>
    <Title>
      <div className={styles.popoverTitle}>
        Sort by:
      </div>
    </Title>
    <Content className="styles.sortList">
      <ListGroup className="styles.listGroup">
        {sortOptions.map(option => <Item action className={styles.listItem} key={option.value} onClick={() => onClickSortOption(option)}>
          {option.value === selectedOption.value && <CheckIcon className={styles.checkIcon}/>}
          {option.label}
        </Item>)}

      </ListGroup>
      <ListGroup className="styles.listGroup">
        {orderOptions.map(option => <Item action className={styles.listItem} key={option.value} onClick={() => toggleSortDirection(option.value)}>
          {option.value === direction && <CheckIcon className={styles.checkIcon}/>}
          {option.label}
        </Item>)}

      </ListGroup>
    </Content>
  </Popover>;

  return <span className={`${styles.columnWrapper} ${className}`}>
    <OverlayTrigger shouldUpdatePosition={true} rootClose trigger='click' placement='bottom' overlay={SortPopover} flip={true} rootCloseEvent='click'>
      <Button size='sm' variant={isSortModified ? 'primary' : 'light'} className={styles.popoverTrigger}>
        <SortLines/>
        <span> {selectedOption.label} </span>
      </Button>
    </OverlayTrigger>
    <Button size='sm' variant={isSortUp ? 'primary' : 'light'} className={styles.sortDirection} data-testid='sort-direction-toggle' onClick={toggleSortDirection}>{sortDirectionIcon}</Button>
  </span>;
};

export default ColumnSort;