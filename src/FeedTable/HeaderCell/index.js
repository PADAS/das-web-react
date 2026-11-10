import { useCallback, useContext, useRef, useSyncExternalStore } from 'react';
import { useTranslation } from 'react-i18next';

import { ReactComponent as ArrowDownIcon } from '../../common/images/icons/arrow-down.svg';
import { ReactComponent as ArrowUpIcon } from '../../common/images/icons/arrow-up.svg';

import FeedTableContext from '../FeedTableContext';

import SelectionCheckbox from '../SelectionCheckbox';

import * as styles from './styles.module.scss';

const COLUMN_MOVE_OFFSET_BY_KEY = { ArrowLeft: -1, ArrowRight: 1 };

const SELECTION_EVENTS = ['modelUpdated', 'selectionChanged'];

const SORT_ICON_BY_DIRECTION = { asc: ArrowUpIcon, desc: ArrowDownIcon };

const calcSelectionState = (api) => {
  const selectedCount = api.getSelectedNodes().length;

  if (!selectedCount) return 'none';
  return selectedCount >= api.getDisplayedRowCount() ? 'all' : 'some';
};

const SelectAllCheckbox = ({ api }) => {
  const { t } = useTranslation('components', { keyPrefix: 'feedTable.headerCell' });

  const subscribeToSelection = useCallback((onChange) => {
    SELECTION_EVENTS.forEach((eventType) => api.addEventListener(eventType, onChange));

    return () => {
      if (!api.isDestroyed()) {
        SELECTION_EVENTS.forEach((eventType) => api.removeEventListener(eventType, onChange));
      }
    };
  }, [api]);
  const selectionState = useSyncExternalStore(subscribeToSelection, () => calcSelectionState(api));

  return <SelectionCheckbox
    aria-label={t('allRowsCheckboxLabel')}
    checked={selectionState === 'all'}
    isIndeterminate={selectionState === 'some'}
    onChange={() => selectionState === 'all' ? api.deselectAll() : api.selectAll()}
  />;
};

const HeaderCell = ({ api, column, displayName, enableSorting, hasSelectAll = false, progressSort }) => {
  const feedTable = useContext(FeedTableContext);

  const sortButtonRef = useRef(null);

  const isMovable = !column.getPinned();

  const subscribeToSort = useCallback((onChange) => {
    column.addEventListener('sortChanged', onChange);

    return () => column.removeEventListener('sortChanged', onChange);
  }, [column]);
  const sort = useSyncExternalStore(subscribeToSort, () => column.getSort() ?? null);

  const SortIcon = SORT_ICON_BY_DIRECTION[sort];

  // Alt and an arrow move the column, the keyboard's drag.
  const onKeyDownSortButton = (event) => {
    const offset = COLUMN_MOVE_OFFSET_BY_KEY[event.key];
    if (event.altKey && offset && isMovable) {
      event.preventDefault();

      const shownColumns = api.getAllGridColumns().filter((gridColumn) => gridColumn.isVisible());
      const targetColumn = shownColumns[shownColumns.indexOf(column) + offset];

      if (targetColumn && !targetColumn.getPinned()) {
        api.moveColumns([column], api.getAllGridColumns().indexOf(targetColumn));

        // The grid moves the header in the page, which takes the focus away.
        setTimeout(() => sortButtonRef.current?.focus());
      }
    }
  };

  return <span className={styles.headerCell}>
    {hasSelectAll && feedTable.isSelectable && <SelectAllCheckbox api={api} />}

    {isMovable && <span aria-hidden="true" className={styles.dragHandle} />}

    {enableSorting
      ? <button
        aria-describedby={isMovable ? feedTable.moveColumnHintId : undefined}
        className={styles.sortButton}
        onClick={() => progressSort(false)}
        onKeyDown={onKeyDownSortButton}
        ref={sortButtonRef}
        type="button"
      >
        <span className={styles.label}>{displayName}</span>

        {SortIcon
          ? <SortIcon aria-hidden="true" className={styles.sortIcon} />
          : <ArrowDownIcon aria-hidden="true" className={`${styles.sortIcon} ${styles.unsorted}`} />}
      </button>
      : <span className={styles.label}>{displayName}</span>}
  </span>;
};

export default HeaderCell;
