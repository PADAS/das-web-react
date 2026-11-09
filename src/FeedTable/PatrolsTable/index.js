import { useCallback, useMemo, useRef } from 'react';
import { useDispatch, useSelector, useStore } from 'react-redux';
import { useTranslation } from 'react-i18next';

import {
  calcPatrolState,
  calcTitleAndSubtitleForPatrol,
  displayEndTimeForPatrol,
  displayNameForPatrolSegment,
  displayStartTimeForPatrol,
  getPatrolLocationCoordinates,
  governingPatrolSegment,
  iconIdForPatrolSegment,
} from '../../utils/patrols';
import { calcPatrolsFeedUrl, fetchFeedTablePatrolsPage, fetchNextPatrolsFeedPage } from '../../ducks/patrols';
import { selectPatrolTrackData } from '../../selectors/patrols';
import { setFeedTableClientSort } from '../../ducks/feed-table-sort';
import { TAB_KEYS } from '../../constants';
import useFeedTableFullLoad from '../useFeedTableFullLoad';
import useJumpToLocation from '../../hooks/useJumpToLocation';
import useNavigate from '../../hooks/useNavigate';

import FeedTable, { formatDateValue, ICON_COLUMN, IconCell } from '..';
import SvgIcon from '../../SvgIcon';

import * as styles from './styles.module.scss';

// Patrols carry their legs, so a page of them weighs more than one of events.
const FULL_LOAD_PARAMS = { page_size: 500, use_cursor: true };

const selectPatrolStore = (state) => state.data.patrolStore;

const PatrolIconCell = ({ value }) => <IconCell><SvgIcon iconId={value} type="patrols" /></IconCell>;

const PatrolsTable = ({ loading, patrols, toolbarContainer }) => {
  const dispatch = useDispatch();
  const jumpToLocation = useJumpToLocation();
  const navigate = useNavigate();
  const store = useStore();
  const { t } = useTranslation('components', { keyPrefix: 'feedTable' });
  const { t: tPatrolState } = useTranslation('patrols', { keyPrefix: 'statusPill.uiStateTitles' });
  const { t: tSideBar } = useTranslation('components', { keyPrefix: 'sideBar' });

  const clientSort = useSelector((state) => state.view.feedTableSort[TAB_KEYS.PATROLS].clientSort);
  const fullLoadUrl = useSelector((state) => calcPatrolsFeedUrl(state, FULL_LOAD_PARAMS));
  const patrolsFeed = useSelector((state) => state.data.patrolsFeed);
  const patrolTypes = useSelector((state) => state.data.patrolTypes);

  const loadingPageUrlRef = useRef(null);

  // The patrols API has no ordering, so the grid sorts every column.
  const fullLoad = useFeedTableFullLoad({
    fetchPage: fetchFeedTablePatrolsPage,
    firstPageUrl: fullLoadUrl,
    hasMorePages: !!patrolsFeed.next,
    isEnabled: !!clientSort,
    rows: patrols,
    selectStore: selectPatrolStore,
    tab: TAB_KEYS.PATROLS,
  });

  const sortable = useCallback((colId) => ({
    sort: clientSort?.colId === colId ? clientSort.sort : null,
    sortable: true,
  }), [clientSort]);

  const columnDefs = useMemo(() => [
    {
      ...ICON_COLUMN,
      cellRenderer: PatrolIconCell,
      menuName: t('iconColumnTitle'),
      valueGetter: (params) => {
        const segment = governingPatrolSegment(params.data);
        return segment ? iconIdForPatrolSegment(patrolTypes, segment) : null;
      },
    },
    {
      colId: 'serial_number',
      field: 'serial_number',
      headerName: t('serialColumnTitle'),
      minWidth: 80,
      ...sortable('serial_number'),
      width: 100,
    },
    {
      colId: 'title',
      flex: 2,
      headerName: t('titleColumnTitle'),
      minWidth: 180,
      ...sortable('title'),
      valueGetter: (params) => calcTitleAndSubtitleForPatrol(params.data, patrolTypes).title ?? '',
    },
    {
      colId: 'patrol_type',
      headerName: t('patrolTypeColumnTitle'),
      minWidth: 140,
      ...sortable('patrol_type'),
      valueGetter: (params) => {
        const segment = governingPatrolSegment(params.data);
        return segment ? displayNameForPatrolSegment(patrolTypes, segment) ?? '' : '';
      },
    },
    {
      colId: 'state',
      headerName: t('stateColumnTitle'),
      minWidth: 120,
      ...sortable('state'),
      valueGetter: (params) => tPatrolState(calcPatrolState(params.data).key),
    },
    {
      colId: 'leader',
      headerName: t('leaderColumnTitle'),
      minWidth: 140,
      ...sortable('leader'),
      valueGetter: (params) => governingPatrolSegment(params.data)?.leader?.name ?? '',
    },
    {
      valueFormatter: formatDateValue,
      colId: 'start',
      headerName: t('patrolStartColumnTitle'),
      minWidth: 170,
      ...sortable('start'),
      valueGetter: (params) => displayStartTimeForPatrol(params.data)?.toISOString() ?? '',
    },
    {
      valueFormatter: formatDateValue,
      colId: 'end',
      headerName: t('patrolEndColumnTitle'),
      minWidth: 170,
      ...sortable('end'),
      valueGetter: (params) => displayEndTimeForPatrol(params.data)?.toISOString() ?? '',
    },
    {
      colId: 'legs',
      defaultHidden: true,
      headerName: t('legsColumnTitle'),
      maxWidth: 100,
      ...sortable('legs'),
      valueGetter: (params) => params.data?.patrol_segments?.length ?? 0,
    },
  ], [patrolTypes, sortable, t, tPatrolState]);

  const getRowClass = useCallback((params) => styles[calcPatrolState(params.data).key], []);

  const onLoadMore = () => {
    const nextPageUrl = patrolsFeed.next;
    if (nextPageUrl && loadingPageUrlRef.current !== nextPageUrl) {
      const releasePageUrl = () => {
        if (loadingPageUrlRef.current === nextPageUrl) {
          loadingPageUrlRef.current = null;
        }
      };

      loadingPageUrlRef.current = nextPageUrl;
      dispatch(fetchNextPatrolsFeedPage(nextPageUrl)).then(releasePageUrl, releasePageUrl);
    }
  };

  const onSortChanged = (event) => {
    if (event.source === 'uiColumnSorted') {
      const sortedColumn = event.api.getColumnState().find((column) => !!column.sort);

      dispatch(setFeedTableClientSort(
        TAB_KEYS.PATROLS,
        sortedColumn ? { colId: sortedColumn.colId, sort: sortedColumn.sort } : null
      ));
    }
  };

  const onOpenRow = (patrol) => {
    navigate(`/${TAB_KEYS.PATROLS}/${patrol.id}`);

    const coordinates = getPatrolLocationCoordinates(selectPatrolTrackData(store.getState(), patrol));
    if (coordinates?.length) {
      jumpToLocation(coordinates);
    }
  };

  return <FeedTable
    ariaLabel={tSideBar('patrolsLink')}
    columnDefs={columnDefs}
    fullLoad={fullLoad}
    getRowClass={getRowClass}
    getRowId={(params) => params.data.id}
    loading={loading}
    onLoadMore={clientSort ? undefined : onLoadMore}
    onOpenRow={onOpenRow}
    onSortChanged={onSortChanged}
    rowData={fullLoad.rows}
    statusMessage={patrolsFeed.count > fullLoad.rows.length
      ? t('loadedPatrolsMessage', { count: patrolsFeed.count, loaded: fullLoad.rows.length })
      : null}
    tableKey={TAB_KEYS.PATROLS}
    toolbarContainer={toolbarContainer}
    totalCount={patrolsFeed.count}
  />;
};

export default PatrolsTable;
