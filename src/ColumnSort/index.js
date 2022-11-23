import React, { useCallback, useEffect, useState } from 'react';
import Button from 'react-bootstrap/Button';
import ListGroup from 'react-bootstrap/ListGroup';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Popover from 'react-bootstrap/Popover';

import { ReactComponent as ArrowDown } from '../common/images/icons/arrow-down.svg';
import { ReactComponent as ArrowUp } from '../common/images/icons/arrow-up.svg';
import { ReactComponent as CheckIcon } from '../common/images/icons/check.svg';
import { ReactComponent as SortLines } from '../common/images/icons/sort-lines.svg';

import { DEFAULT_EVENT_SORT, SORT_DIRECTION } from '../utils/event-filter';

import styles from './styles.module.scss';

const ColumnSort = ({ className = '', sortOptions, orderOptions, value, onChange }) => {
  const [isSortUp, setSortDirection] = useState(value === SORT_DIRECTION.up);

  const [direction, selectedOption] = value;
  const isSortModified = !DEFAULT_EVENT_SORT.includes(selectedOption);

  const onClickSortOption = useCallback((option) => {
    if (option.value !== selectedOption.value){
      onChange([direction, option]);
    }
  }, [direction, onChange, selectedOption.value]);

  const toggleSortDirection = useCallback(() => {
    const newDir = direction === SORT_DIRECTION.up ? SORT_DIRECTION.down : SORT_DIRECTION.up;

    onChange([newDir, selectedOption]);
  }, [direction, onChange, selectedOption]);

  const changeSortDirection = useCallback((value) => {
    if (direction !== value){
      onChange([SORT_DIRECTION[value], selectedOption]);
    }
  }, [direction, onChange, selectedOption]);

  useEffect(() => {
    setSortDirection(direction === SORT_DIRECTION.up);
  }, [direction]);

  const sortDirectionIcon = isSortUp ? <ArrowUp /> : <ArrowDown />;

  const SortPopover = <Popover className={styles.sortPopover} id='sort-popover'>
    <Popover.Header>
      <div className={styles.popoverTitle}>
        Sort by:
      </div>
    </Popover.Header>

    <Popover.Body className="styles.sortList">
      <ListGroup className="styles.listGroup" data-testid="sort-options">
        {sortOptions.map((option) => <ListGroup.Item
          action
          className={styles.listItem}
          key={option.value}
          onClick={() => onClickSortOption(option)}
        >
          {option.value === selectedOption.value && <CheckIcon className={styles.checkIcon}/>}
          {option.label}
        </ListGroup.Item>)}
      </ListGroup>

      <ListGroup className="styles.listGroup" data-testid="order-options">
        {orderOptions.map(option => <ListGroup.Item
          action
          className={styles.listItem}
          key={option.value}
          onClick={() => changeSortDirection(option.value)}
        >
          {option.value === direction && <CheckIcon className={styles.checkIcon}/>}
          {option.label}
        </ListGroup.Item>)}
      </ListGroup>
    </Popover.Body>
  </Popover>;

  return <span className={`${styles.columnWrapper} ${className}`}>
    <OverlayTrigger
      shouldUpdatePosition={true}
      rootClose
      trigger='click'
      placement='bottom'
      overlay={SortPopover}
      flip={true}
      rootCloseEvent='click'
    >
      <Button
        className={styles.popoverTrigger}
        data-testid="sort-popover-trigger"
        size='sm'
        variant={isSortModified ? 'primary' : 'light'}
      >
        <SortLines />
        <span>{selectedOption.label}</span>
      </Button>
    </OverlayTrigger>

    <Button
      className={styles.sortDirection}
      data-testid='sort-direction-toggle'
      onClick={toggleSortDirection}
      size='sm'
      variant={isSortUp ? 'primary' : 'light'}
    >
      {sortDirectionIcon}
    </Button>
  </span>;
};

export default ColumnSort;