import React, { useCallback, useState, useMemo } from 'react';

import Button from 'react-bootstrap/Button';

import isFunction from 'lodash/isFunction';

import { ASCENDING_SORT_ORDER, DESCENDING_SORT_ORDER } from '../../constants';

import styles from './styles.module.scss';

import { ReactComponent as ArrowDownIcon } from '../../common/images/icons/arrow-down.svg';
import { ReactComponent as ArrowUpIcon } from '../../common/images/icons/arrow-up.svg';


const sortDescending = (a, b) => a.sortDate < b.sortDate ? 1: -1;
const sortAscending = (a, b) => a.sortDate > b.sortDate  ? 1: -1;

const useSortedNodes = (
  list = [],
  sortOrder = DESCENDING_SORT_ORDER,
) => {

  const isDescending = sortOrder === DESCENDING_SORT_ORDER;
  const isAscending = sortOrder === ASCENDING_SORT_ORDER;

  const sortFn = useMemo(() =>
    (isFunction(sortOrder) && sortOrder)
  || (isDescending && sortDescending)
  || (isAscending && sortAscending)
  , [isAscending, isDescending, sortOrder]);

  if (!sortFn) {
    throw new Error('invalid sort supplied to useSortedNodes');
  }

  return useMemo(() =>
    list
      .sort(sortFn)
      .map(({ node }) =>
        node
      )

  , [list, sortFn]);
};

const DefaultButtonComponent = ({ toggleSortFn, disabled, testId, sortOrder }) =>
  <Button className={styles.timeSortButton}
    type='button' data-testid={testId}
    disabled={disabled} onClick={toggleSortFn}
    variant={sortOrder === DESCENDING_SORT_ORDER ? 'secondary' : 'primary'}
    >
    {sortOrder === DESCENDING_SORT_ORDER ? <ArrowDownIcon /> : <ArrowUpIcon />}
  </Button>;

export const useSortedNodesWithToggleBtn = (
  list = [{ sortDate: new Date(0), node: null }],
  onSort = null,
  defaultSortOrder = DESCENDING_SORT_ORDER,
  ButtonComponent = DefaultButtonComponent,
) => {

  const [sortOrder, setSortOrder] = useState(defaultSortOrder);

  const onClickTimeSortButton = useCallback(() => {
    const newSortOrder = sortOrder === DESCENDING_SORT_ORDER
      ? ASCENDING_SORT_ORDER
      : DESCENDING_SORT_ORDER;

    setSortOrder(newSortOrder);
    onSort?.(newSortOrder);
  }, [onSort, sortOrder]);

  const SortButton = (props) =>
    <ButtonComponent
      toggleSortFn={onClickTimeSortButton}
      sortOrder={sortOrder}
      testId='time-sort-btn'
      disabled={!list.length}
      {...props} />;

  const renderedNodes = useSortedNodes(list, sortOrder);

  return [SortButton, renderedNodes];

};