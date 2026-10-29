import { useEffect, useMemo } from 'react';
import { useDispatch, useSelector, useStore } from 'react-redux';
import { useTranslation } from 'react-i18next';

import {
  calcPatrolState,
  calcTitleAndSubtitleForPatrol,
  displayEndTimeForPatrol,
  displayNameForPatrolSegment,
  displayStartTimeForPatrol,
  getPatrolLocationCoordinates,
} from '../utils/patrols';
import { fetchNextPatrolsFeedPage } from '../ducks/patrols';
import { selectPatrolTrackData } from '../selectors/patrols';
import { TAB_KEYS } from '../constants';
import useJumpToLocation from '../hooks/useJumpToLocation';
import useNavigate from '../hooks/useNavigate';

import DateTime from '../DateTime';
import FeedTable from '.';

import * as styles from './styles.module.scss';

// A safety cap, so a bad `next` link cannot loop forever.
const MAX_PAGES = 1000;

const lastSegment = (patrol) => patrol?.patrol_segments?.[patrol.patrol_segments.length - 1];

const DateCell = ({ value }) => value ? <DateTime className={styles.dateCell} date={value} showElapsed={false} /> : null;

const PatrolsTable = ({ loading, patrols, toolbarContainer }) => {
  const dispatch = useDispatch();
  const jumpToLocation = useJumpToLocation();
  const navigate = useNavigate();
  const store = useStore();
  const { t } = useTranslation('components', { keyPrefix: 'feedTable' });
  const { t: tPatrolState } = useTranslation('patrols', { keyPrefix: 'statusPill.uiStateTitles' });
  const { t: tSideBar } = useTranslation('components', { keyPrefix: 'sideBar' });

  const patrolTypes = useSelector((state) => state.data.patrolTypes);

  // The patrols API has no ordering of its own, so the table sorts on its own
  // and needs every page for that sort to be true.
  useEffect(() => {
    if (loading) return undefined;

    let cancelled = false;
    const loadAllPages = async () => {
      for (let pages = 0; !cancelled && pages < MAX_PAGES; pages += 1) {
        const { next } = store.getState().data.patrolsFeed;
        if (!next) return;

        try {
          await dispatch(fetchNextPatrolsFeedPage(next));
        } catch {
          return;
        }
      }
    };
    loadAllPages();

    return () => { cancelled = true; };
  }, [dispatch, loading, store]);

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
        const segment = lastSegment(params.data);
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
      valueGetter: (params) => lastSegment(params.data)?.leader?.name ?? '',
    },
    {
      cellRenderer: DateCell,
      colId: 'start',
      headerName: t('columnPatrolStart'),
      minWidth: 170,
      sortable: true,
      valueGetter: (params) => displayStartTimeForPatrol(params.data)?.toISOString() ?? '',
    },
    {
      cellRenderer: DateCell,
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
    onOpenRow={onOpenRow}
    rowData={patrols}
    tableKey={TAB_KEYS.PATROLS}
    toolbarContainer={toolbarContainer}
  />;
};

export default PatrolsTable;
