import React, { useState, useMemo } from 'react';

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

export const useSortedNodesWithToggleBtn = (
  list = [{ sortDate: new Date(0), node: null }],
  defaultSortOrder = DESCENDING_SORT_ORDER,
) => {

  const [sortOrder, setSortOrder] = useState(defaultSortOrder);

  const onClickTimeSortButton = () => {
    setSortOrder(
      sortOrder === DESCENDING_SORT_ORDER
        ? ASCENDING_SORT_ORDER
        : DESCENDING_SORT_ORDER
    );
  };

  const sortButton = <Button
      className={styles.timeSortButton}
      data-testid="time-sort-btn"
      disabled={!list.length}
      onClick={onClickTimeSortButton}
      type="button"
      variant={sortOrder === DESCENDING_SORT_ORDER ? 'secondary' : 'primary'}  >
    {sortOrder === DESCENDING_SORT_ORDER ? <ArrowDownIcon /> : <ArrowUpIcon />}
  </Button>;

  const renderedNodes = useSortedNodes(list, sortOrder);

  return [sortButton, renderedNodes];

};