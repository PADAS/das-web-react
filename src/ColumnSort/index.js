import React, { useCallback, useEffect, useState } from 'react';
import Button from 'react-bootstrap/Button';
import ListGroup from 'react-bootstrap/ListGroup';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Popover from 'react-bootstrap/Popover';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';

import { ReactComponent as ArrowDown } from '../common/images/icons/arrow-down.svg';
import { ReactComponent as ArrowUp } from '../common/images/icons/arrow-up.svg';
import { ReactComponent as CheckIcon } from '../common/images/icons/check.svg';
import { ReactComponent as SortLines } from '../common/images/icons/sort-lines.svg';

import { DEFAULT_EVENT_SORT, SORT_DIRECTION } from '../constants';

import styles from './styles.module.scss';

const ColumnSort = ({ className, sortOptions, orderOptions, value, onChange }) => {
  const { t } = useTranslation('reports', { keyPrefix: 'columnSort' });

  const [isSortUp, setSortDirection] = useState(value === SORT_DIRECTION.up);

  const [direction, selectedOption] = value;
  const isSortModified = !DEFAULT_EVENT_SORT.find(({ value, key }) => value === selectedOption.value && key === selectedOption.key );

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

  const SortPopover = <Popover className={styles.sortPopover} id="sort-popover">
    <Popover.Header>
      <div className={styles.popoverTitle}>
        {t('popoverTitle')}
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

          { t(`eventSortOptions.${option.key}`) }
        </ListGroup.Item>)}
      </ListGroup>

      <ListGroup className="styles.listGroup" data-testid="order-options">
        {orderOptions.map((option) => <ListGroup.Item
          action
          className={styles.listItem}
          key={option.value}
          onClick={() => changeSortDirection(option.value)}
        >
          {option.value === direction && <CheckIcon className={styles.checkIcon}/>}

          { t(`eventOrderOptions.${option.key}`) }
        </ListGroup.Item>)}
      </ListGroup>
    </Popover.Body>
  </Popover>;

  return <span className={`${styles.columnWrapper} ${className}`}>
    <OverlayTrigger
      flip={true}
      overlay={SortPopover}
      placement="bottom"
      rootClose
      rootCloseEvent="click"
      shouldUpdatePosition={true}
      trigger="click"
    >
      <Button
        className={styles.popoverTrigger}
        data-testid="sort-popover-trigger"
        size="sm"
        variant={isSortModified ? 'primary' : 'light'}
      >
        <SortLines />

        { t(`eventSortOptions.${selectedOption.key}`) }
      </Button>
    </OverlayTrigger>

    <Button
      aria-label={t(`sortDirectionToggleLabel.${isSortUp ? 'ascending' : 'descending'}`)}
      className={styles.sortDirection}
      data-testid="sort-direction-toggle"
      onClick={toggleSortDirection}
      size="sm"
      title={t(`sortDirectionToggleTitle.${isSortUp ? 'ascending' : 'descending'}`)}
      variant={isSortUp ? 'primary' : 'light'}
    >
      {isSortUp ? <ArrowUp /> : <ArrowDown />}
    </Button>
  </span>;
};

ColumnSort.defaultProps= {
  className: '',
};

ColumnSort.propTypes= {
  className: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  orderOptions: PropTypes.arrayOf(PropTypes.shape({
    value: PropTypes.string,
  })).isRequired,
  sortOptions: PropTypes.arrayOf(PropTypes.shape({
    value: PropTypes.string,
  })).isRequired,
  value: PropTypes.array.isRequired,
};

export default ColumnSort;
