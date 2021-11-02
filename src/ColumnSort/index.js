import React, { useState, useEffect } from 'react';
import Button from 'react-bootstrap/Button';
import ListGroup from 'react-bootstrap/ListGroup';
import Popover from 'react-bootstrap/Popover';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import {  DEFAULT_EVENT_SORT, SORT_DIRECTION } from '../utils/event-filter';

import styles from './styles.module.scss';
import { ReactComponent as ArrowDown } from '../common/images/icons/arrow-down.svg';
import { ReactComponent as ArrowUp } from '../common/images/icons/arrow-up.svg';
import { ReactComponent as SortLines } from '../common/images/icons/sort-lines.svg';
import { ReactComponent as CheckIcon } from '../common/images/icons/check.svg';

const { Title, Content } = Popover;
const { Item } = ListGroup;
const UP = SORT_DIRECTION.up;
const DOWN = SORT_DIRECTION.down;

const ColumnSort = (props) => {

  const { className = '', sortOptions, orderOptions, value, onChange } = props;
  const [isSortUp, setSortDirection] = useState(value === UP);
  const [direction, selectedOption] = value;
  const isSortModified = !DEFAULT_EVENT_SORT.includes(selectedOption);

  const onClickSortOption = (option) => {
    onChange([direction, option]);
  };

  useEffect(() => {
    setSortDirection(direction === UP);
  }, [direction]);

  const sortDirectionIcon = isSortUp ? <ArrowUp /> : <ArrowDown />;

  const SortPopover = <Popover className={styles.sortPopover} id='sort-popover'>
    <Title>
      <div className={styles.popoverTitle}>
        Sort by:
      </div>
    </Title>
    <Content className="styles.sortList">
      <ListGroup className="styles.listGroup" data-testid="sort-options">
        {sortOptions.map(option => <Item action className={styles.listItem} key={option.value} onClick={() => onClickSortOption(option)}>
          {option.value === selectedOption.value && <CheckIcon className={styles.checkIcon}/>}
          {option.label}
        </Item>)}

      </ListGroup>
      <ListGroup className="styles.listGroup" data-testid="order-options">
        {orderOptions.map(option => (
          <Item
            action
            className={styles.listItem}
            key={option.value}
            onClick={() => direction !== option.value ? onChange([SORT_DIRECTION[option.value], selectedOption]) : () => false}
          >
            {option.value === direction && <CheckIcon className={styles.checkIcon}/>}
            {option.label}
          </Item>
        ))}

      </ListGroup>
    </Content>
  </Popover>;

  return <span className={`${styles.columnWrapper} ${className}`}>
    <OverlayTrigger shouldUpdatePosition={true} rootClose trigger='click' placement='bottom' overlay={SortPopover} flip={true} rootCloseEvent='click'>
      <Button size='sm' variant={isSortModified ? 'primary' : 'light'} className={styles.popoverTrigger} data-testid="sort-popover-trigger">
        <SortLines/>
        <span> {selectedOption.label} </span>
      </Button>
    </OverlayTrigger>
    <Button
      size='sm'
      data-testid='sort-direction-toggle'
      className={styles.sortDirection}
      variant={isSortUp ? 'primary' : 'light'}
      onClick={() => onChange([direction === UP ? DOWN : UP, selectedOption])}
    >
      {sortDirectionIcon}
    </Button>
  </span>;
};

export default ColumnSort;