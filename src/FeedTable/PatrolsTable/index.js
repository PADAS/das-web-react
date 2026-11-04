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
import { fetchNextPatrolsFeedPage } from '../../ducks/patrols';
import { selectPatrolTrackData } from '../../selectors/patrols';
import { TAB_KEYS } from '../../constants';
import useJumpToLocation from '../../hooks/useJumpToLocation';
import useNavigate from '../../hooks/useNavigate';

import FeedTable, { formatDateValue, IconCell } from '..';
import SvgIcon from '../../SvgIcon';

import * as styles from './styles.module.scss';

const PatrolIconCell = ({ value }) => <IconCell><SvgIcon iconId={value} type="patrols" /></IconCell>;

const PatrolsTable = ({ loading, patrols, toolbarContainer }) => {
  const dispatch = useDispatch();
  const jumpToLocation = useJumpToLocation();
  const navigate = useNavigate();
  const store = useStore();
  const { t } = useTranslation('components', { keyPrefix: 'feedTable' });
  const { t: tPatrolState } = useTranslation('patrols', { keyPrefix: 'statusPill.uiStateTitles' });
  const { t: tSideBar } = useTranslation('components', { keyPrefix: 'sideBar' });

  const patrolsFeed = useSelector((state) => state.data.patrolsFeed);
  const patrolTypes = useSelector((state) => state.data.patrolTypes);

  const loadingMoreRef = useRef(false);

  const columnDefs = useMemo(() => [
    {
      cellRenderer: PatrolIconCell,
      colId: 'icon',
      headerName: '',
      maxWidth: 56,
      menuName: t('iconColumnTitle'),
      minWidth: 56,
      resizable: false,
      valueGetter: (params) => {
        const segment = governingPatrolSegment(params.data);
        return segment ? iconIdForPatrolSegment(patrolTypes, segment) : null;
      },
    },
    { colId: 'serial_number', field: 'serial_number', headerName: t('serialColumnTitle'), minWidth: 80, sortable: true, width: 100 },
    {
      colId: 'title',
      flex: 2,
      headerName: t('titleColumnTitle'),
      minWidth: 180,
      sortable: true,
      valueGetter: (params) => calcTitleAndSubtitleForPatrol(params.data, patrolTypes).title ?? '',
    },
    {
      colId: 'patrol_type',
      headerName: t('patrolTypeColumnTitle'),
      minWidth: 140,
      sortable: true,
      valueGetter: (params) => {
        const segment = governingPatrolSegment(params.data);
        return segment ? displayNameForPatrolSegment(patrolTypes, segment) ?? '' : '';
      },
    },
    {
      colId: 'state',
      headerName: t('stateColumnTitle'),
      minWidth: 120,
      sortable: true,
      valueGetter: (params) => tPatrolState(calcPatrolState(params.data).key),
    },
    {
      colId: 'leader',
      headerName: t('leaderColumnTitle'),
      minWidth: 140,
      sortable: true,
      valueGetter: (params) => governingPatrolSegment(params.data)?.leader?.name ?? '',
    },
    {
      valueFormatter: formatDateValue,
      colId: 'start',
      headerName: t('patrolStartColumnTitle'),
      minWidth: 170,
      sortable: true,
      valueGetter: (params) => displayStartTimeForPatrol(params.data)?.toISOString() ?? '',
    },
    {
      valueFormatter: formatDateValue,
      colId: 'end',
      headerName: t('patrolEndColumnTitle'),
      minWidth: 170,
      sortable: true,
      valueGetter: (params) => displayEndTimeForPatrol(params.data)?.toISOString() ?? '',
    },
    {
      colId: 'legs',
      defaultHidden: true,
      headerName: t('legsColumnTitle'),
      maxWidth: 100,
      sortable: true,
      valueGetter: (params) => params.data?.patrol_segments?.length ?? 0,
    },
  ], [patrolTypes, t, tPatrolState]);

  const getRowClass = useCallback((params) => styles[calcPatrolState(params.data).key], []);

  // The patrols API has no ordering, so the table sorts the loaded pages only.
  const onLoadMore = () => {
    if (!loadingMoreRef.current && patrolsFeed.next) {
      loadingMoreRef.current = true;
      dispatch(fetchNextPatrolsFeedPage(patrolsFeed.next))
        .catch(() => {})
        .finally(() => {
          loadingMoreRef.current = false;
        });
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
    getRowClass={getRowClass}
    getRowId={(params) => params.data.id}
    loading={loading}
    onLoadMore={onLoadMore}
    onOpenRow={onOpenRow}
    rowData={patrols}
    statusMessage={patrolsFeed.count > patrols.length
      ? t('loadedPatrolsMessage', { count: patrolsFeed.count, loaded: patrols.length })
      : null}
    tableKey={TAB_KEYS.PATROLS}
    toolbarContainer={toolbarContainer}
  />;
};

export default PatrolsTable;
