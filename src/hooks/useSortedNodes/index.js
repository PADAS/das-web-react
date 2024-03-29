import React, { useCallback, useState, useMemo } from 'react';
import Button from 'react-bootstrap/Button';
import { useTranslation } from 'react-i18next';

import { ReactComponent as ArrowDownIcon } from '../../common/images/icons/arrow-down.svg';
import { ReactComponent as ArrowUpIcon } from '../../common/images/icons/arrow-up.svg';

import { ASCENDING_SORT_ORDER, DESCENDING_SORT_ORDER } from '../../constants';
import isFunction from 'lodash/isFunction';

import styles from './styles.module.scss';

const sortAscending = (a, b) => a.sortDate > b.sortDate ? 1 : -1;

const sortDescending = (a, b) => a.sortDate < b.sortDate ? 1 : -1;

const useSortedNodes = (list = [], sortOrder = DESCENDING_SORT_ORDER) => {
  const isAscending = sortOrder === ASCENDING_SORT_ORDER;
  const isDescending = sortOrder === DESCENDING_SORT_ORDER;

  const sortFn = useMemo(
    () => (isFunction(sortOrder) && sortOrder) || (isDescending && sortDescending) || (isAscending && sortAscending),
    [isAscending, isDescending, sortOrder]
  );

  if (!sortFn) {
    throw new Error('invalid sort supplied to useSortedNodes');
  }

  return useMemo(() => list.sort(sortFn).map(({ node }) =>  node), [list, sortFn]);
};

const DefaultButtonComponent = ({ toggleSortFn, disabled, testId, sortOrder, ...props }) => <Button className={styles.timeSortButton}
    data-testid={testId}
    disabled={disabled}
    onClick={toggleSortFn}
    type='button'
    variant={sortOrder === DESCENDING_SORT_ORDER ? 'secondary' : 'primary'}
    {...props}
  >
  {sortOrder === DESCENDING_SORT_ORDER ? <ArrowDownIcon /> : <ArrowUpIcon />}
</Button>;

export const useSortedNodesWithToggleBtn = (
  list = [{ sortDate: new Date(0), node: null }],
  onSort = null,
  defaultSortOrder = DESCENDING_SORT_ORDER,
  ButtonComponent = DefaultButtonComponent,
) => {
  const { t } = useTranslation('components', { keyPrefix: 'sortedNodes' });

  const [sortOrder, setSortOrder] = useState(defaultSortOrder);

  const onClickTimeSortButton = useCallback(() => {
    const newSortOrder = sortOrder === DESCENDING_SORT_ORDER ? ASCENDING_SORT_ORDER : DESCENDING_SORT_ORDER;

    setSortOrder(newSortOrder);
    onSort?.(newSortOrder);
  }, [onSort, sortOrder]);

  const SortButton = (props) => <ButtonComponent
    aria-label={t(sortOrder === DESCENDING_SORT_ORDER ? 'labelDescending' : 'labelAscending')}
    disabled={!list.length}
    sortOrder={sortOrder}
    testId='time-sort-btn'
    title={t(sortOrder === DESCENDING_SORT_ORDER ? 'titleDescending' : 'titleAscending')}
    toggleSortFn={onClickTimeSortButton}
    {...props}
  />;

  const renderedNodes = useSortedNodes(list, sortOrder);

  return [SortButton, renderedNodes];
};
