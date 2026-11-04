import { useMemo, useRef } from 'react';
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
} from '../../utils/patrols';
import { fetchNextPatrolsFeedPage } from '../../ducks/patrols';
import { selectPatrolTrackData } from '../../selectors/patrols';
import { TAB_KEYS } from '../../constants';
import useJumpToLocation from '../../hooks/useJumpToLocation';
import useNavigate from '../../hooks/useNavigate';

import FeedTable, { formatDateValue } from '..';

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
    { colId: 'serial_number', field: 'serial_number', headerName: t('columnSerial'), minWidth: 80, sortable: true, width: 100 },
    {
      colId: 'title',
      flex: 2,
      headerName: t('columnTitle'),
      minWidth: 180,
      sortable: true,
      valueGetter: (params) => calcTitleAndSubtitleForPatrol(params.data, patrolTypes).title ?? '',
    },
    {
      colId: 'patrol_type',
      headerName: t('columnPatrolType'),
      minWidth: 140,
      sortable: true,
      valueGetter: (params) => {
        const segment = governingPatrolSegment(params.data);
        return segment ? displayNameForPatrolSegment(patrolTypes, segment) ?? '' : '';
      },
    },
    {
      colId: 'state',
      headerName: t('columnState'),
      minWidth: 120,
      sortable: true,
      valueGetter: (params) => tPatrolState(calcPatrolState(params.data).key),
    },
    {
      colId: 'leader',
      headerName: t('columnLeader'),
      minWidth: 140,
      sortable: true,
      valueGetter: (params) => governingPatrolSegment(params.data)?.leader?.name ?? '',
    },
    {
      valueFormatter: formatDateValue,
      colId: 'start',
      headerName: t('columnPatrolStart'),
      minWidth: 170,
      sortable: true,
      valueGetter: (params) => displayStartTimeForPatrol(params.data)?.toISOString() ?? '',
    },
    {
      valueFormatter: formatDateValue,
      colId: 'end',
      headerName: t('columnPatrolEnd'),
      minWidth: 170,
      sortable: true,
      valueGetter: (params) => displayEndTimeForPatrol(params.data)?.toISOString() ?? '',
    },
    {
      colId: 'legs',
      defaultHidden: true,
      headerName: t('columnLegs'),
      maxWidth: 100,
      sortable: true,
      valueGetter: (params) => params.data?.patrol_segments?.length ?? 0,
    },
  ], [patrolTypes, t, tPatrolState]);

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
