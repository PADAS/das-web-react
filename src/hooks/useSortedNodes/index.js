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

const defaultRenderFn = ({ toggleSortFn, disabled, testId = 'time-sort-btn', sortOrder }) =>
  <Button className={styles.timeSortButton}
    type='button' data-testid={testId}
    disabled={disabled} onClick={toggleSortFn}
    variant={sortOrder === DESCENDING_SORT_ORDER ? 'secondary' : 'primary'}
    >
    {sortOrder === DESCENDING_SORT_ORDER ? <ArrowDownIcon /> : <ArrowUpIcon />}
  </Button>;

export const useSortedNodesWithToggleBtn = (
  list = [{ sortDate: new Date(0), node: null }],
  defaultSortOrder = DESCENDING_SORT_ORDER,
  buttonRenderFn = defaultRenderFn,
) => {

  const [sortOrder, setSortOrder] = useState(defaultSortOrder);

  const onClickTimeSortButton = useCallback(() => {
    setSortOrder(
      sortOrder === DESCENDING_SORT_ORDER
        ? ASCENDING_SORT_ORDER
        : DESCENDING_SORT_ORDER
    );
  }, [sortOrder]);

  const sortButton = useMemo(() => buttonRenderFn({
    toggleSortFn: onClickTimeSortButton,
    sortOrder,
    testId: 'time-sort-btn',
    disabled: !list.length,

  }), [list.length, onClickTimeSortButton, buttonRenderFn, sortOrder]);

  const renderedNodes = useSortedNodes(list, sortOrder);

  return [sortButton, renderedNodes];

};