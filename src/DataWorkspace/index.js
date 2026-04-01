import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import debounce from 'lodash/debounce';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import MoonLoader from 'react-spinners/MoonLoader';

import KebabMenu from '../KebabMenu';
import { useDispatch, useSelector, useStore } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';

import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

import { ReactComponent as ChevronRightIcon } from '../common/images/icons/chevron-right.svg';

import DateTime from '../DateTime';
import { API_URL, SYSTEM_CONFIG_FLAGS } from '../constants';
import { EVENT_API_URL, fetchNextEventFeedPage } from '../ducks/events';
import { PATROLS_API_URL, fetchNextPatrolsFeedPage } from '../ducks/patrols';
import EventFilter from '../EventFilter';
import PatrolFilter from '../PatrolFilter';
import { usePatrolsPermissions } from '../hooks/usePermissions';
import useReportsFeed from '../SideBar/useReportsFeed';
import useFetchPatrolsFeed from '../SideBar/useFetchPatrolsFeed';
import { getFeedEvents } from '../selectors';
import { selectPatrolsFeedMappedFromStore } from '../selectors/patrols';
import { displayTitleForEvent } from '../utils/events';
import { sortPatrolList } from '../utils/patrols';
import { showToast } from '../utils/toast';

import {
  processDrillGridCellForCsvExport,
  processMainGridCellForCsvExport,
  resolveValueForDataWorkspaceClipboard,
  serializeCellValueForExport,
} from './csvCellSerialization';
import * as styles from './DataWorkspace.module.scss';

ModuleRegistry.registerModules([AllCommunityModule]);

const SUBJECTS_URL = `${API_URL}subjects`;

const ENTITY = { EVENTS: 'events', SUBJECTS: 'subjects', PATROLS: 'patrols' };

/** Shared by infinite scroll and filter backfill ("fill the viewport"). */
const SCROLL_LOAD_EDGE_ROWS = 6;

/** Safety cap so a buggy `next` link cannot loop forever while exporting. */
const MAX_FEED_PAGES_PER_EXPORT = 1000;

/** When column/quick filters shrink the visible set, load more feed pages until the viewport is "filled" or the feed ends. */
const FILTER_BACKFILL_DEBOUNCE_MS = 400;
const FILTER_BACKFILL_MAX_PAGES = 500;
const FILTER_BACKFILL_MIN_ROWS = 24;
const FILTER_BACKFILL_ROW_CAP = 120;

const readPatrolsFeedNext = (state) => {
  const feed = state.data.patrolsFeed;
  return Array.isArray(feed) ? null : feed?.next ?? null;
};

const countFilteredLeafRows = (api) => {
  if (!api?.forEachNodeAfterFilter) return 0;
  let n = 0;
  api.forEachNodeAfterFilter((node) => {
    if (!node.group) n += 1;
  });
  return n;
};

const mainGridHasActiveFilter = (api) => {
  if (!api) return false;
  const model = api.getFilterModel?.() ?? {};
  if (Object.keys(model).length > 0) return true;
  if (typeof api.isQuickFilterPresent === 'function' && api.isQuickFilterPresent()) return true;
  return false;
};

const getFilterBackfillTargetRows = (api) => {
  if (!api || typeof api.getLastDisplayedRowIndex !== 'function') {
    return FILTER_BACKFILL_MIN_ROWS;
  }
  const last = api.getLastDisplayedRowIndex();
  const displayed = api.getDisplayedRowCount?.() ?? 0;
  const fromViewport = Math.max(
    FILTER_BACKFILL_MIN_ROWS,
    (last >= 0 ? last + 1 : 0) + SCROLL_LOAD_EDGE_ROWS,
    displayed + SCROLL_LOAD_EDGE_ROWS,
  );
  return Math.min(FILTER_BACKFILL_ROW_CAP, fromViewport);
};

const shouldFetchMoreForFilteredView = (filteredCount, fillTarget, hasNext) => {
  if (!hasNext) return false;
  if (filteredCount === 0) return true;
  return filteredCount < fillTarget;
};

const unpackPagedResults = (response) => {
  const body = response.data?.data;
  if (Array.isArray(body)) {
    return { results: body, next: null, count: body.length };
  }
  return {
    results: body?.results ?? [],
    next: body?.next ?? null,
    count: body?.count ?? 0,
  };
};

const formatCellPreview = (value) => {
  if (value === null || value === undefined) return '';
  const t = typeof value;
  if (t === 'string' || t === 'number' || t === 'boolean') return String(value);
  if (Array.isArray(value)) return `Array(${value.length})`;
  return 'Object';
};

const rowsFromValue = (raw, depth = 0) => {
  const p = `d${depth}`;
  if (raw === null || raw === undefined) return [];
  if (Array.isArray(raw)) {
    return raw.map((item, i) => ({
      rowKey: `${p}-a-${i}`,
      field: String(i),
      valueLabel: formatCellPreview(item),
      raw: item,
    }));
  }
  if (typeof raw === 'object') {
    return Object.keys(raw).sort().map((key) => ({
      rowKey: `${p}-o-${key}`,
      field: key,
      valueLabel: formatCellPreview(raw[key]),
      raw: raw[key],
    }));
  }
  return [];
};

const defaultColDef = {
  filter: true,
  resizable: true,
  sortable: true,
};

const DataWorkspaceEventDateCell = ({ date }) => {
  const { t } = useTranslation('reports', { keyPrefix: 'reportListItem' });
  if (!date) return null;
  return <DateTime date={date} showElapsed suffix={t('dateTimeSuffix')} />;
};

const DataWorkspace = () => {
  const dispatch = useDispatch();
  const store = useStore();
  const { t } = useTranslation('components', { keyPrefix: 'dataWorkspace' });

  const eventsEnabled = useSelector((state) => state.view.systemConfig[SYSTEM_CONFIG_FLAGS.EVENTS]);
  const subjectsEnabled = useSelector((state) => state.view.systemConfig[SYSTEM_CONFIG_FLAGS.SUBJECTS]);
  const patrolManagementEnabled = useSelector((state) => state.view.systemConfig[SYSTEM_CONFIG_FLAGS.PATROL_MANAGEMENT]);
  const eventTypes = useSelector((state) => state.data.eventTypes ?? []);

  const { hasPatrolsReadPermission } = usePatrolsPermissions();
  const canReadPatrols = patrolManagementEnabled && hasPatrolsReadPermission;

  useReportsFeed();
  const patrolsFeed = useFetchPatrolsFeed() ?? { loadingPatrolsFeed: false };

  const feedEvents = useSelector((state) => getFeedEvents(state));
  const patrolsFeedMeta = useSelector((state) => state.data.patrolsFeed);
  const patrolsFromStore = useSelector(selectPatrolsFeedMappedFromStore);

  const sortedPatrols = useMemo(
    () => sortPatrolList(patrolsFromStore),
    [patrolsFromStore],
  );

  const defaultEntity = useMemo(() => {
    if (eventsEnabled) return ENTITY.EVENTS;
    if (subjectsEnabled) return ENTITY.SUBJECTS;
    if (canReadPatrols) return ENTITY.PATROLS;
    return ENTITY.EVENTS;
  }, [canReadPatrols, eventsEnabled, subjectsEnabled]);

  const [entity, setEntity] = useState(defaultEntity);
  const [drillStack, setDrillStack] = useState([]);
  const [subjectRows, setSubjectRows] = useState([]);
  const [subjectsLoading, setSubjectsLoading] = useState(false);
  const [subjectsError, setSubjectsError] = useState(null);
  const [gridBusyReason, setGridBusyReason] = useState(null);
  const interactionBlockedRef = useRef(false);

  const mainGridApiRef = useRef(null);
  const drillGridApiRef = useRef(null);
  const rootRef = useRef(null);
  const loadingMoreFeedRef = useRef(false);
  const debouncedLoadMoreFeedRef = useRef(debounce(() => {}, 400));
  const filterBackfillGenRef = useRef(0);
  const filterBackfillTimeoutRef = useRef(null);
  const entityRef = useRef(entity);
  const drillStackLengthRef = useRef(drillStack.length);

  useEffect(() => {
    entityRef.current = entity;
    drillStackLengthRef.current = drillStack.length;
  }, [drillStack.length, entity]);

  useEffect(() => {
    filterBackfillGenRef.current += 1;
    if (filterBackfillTimeoutRef.current) {
      clearTimeout(filterBackfillTimeoutRef.current);
      filterBackfillTimeoutRef.current = null;
    }
  }, [drillStack.length, entity]);

  const maybeLoadMoreFeed = useCallback(() => {
    if (loadingMoreFeedRef.current) return;
    if (entity === ENTITY.EVENTS && feedEvents.next) {
      loadingMoreFeedRef.current = true;
      dispatch(fetchNextEventFeedPage(feedEvents.next)).finally(() => {
        loadingMoreFeedRef.current = false;
      });
    } else if (entity === ENTITY.PATROLS && patrolsFeedMeta?.next) {
      loadingMoreFeedRef.current = true;
      dispatch(fetchNextPatrolsFeedPage(patrolsFeedMeta.next)).finally(() => {
        loadingMoreFeedRef.current = false;
      });
    }
  }, [dispatch, entity, feedEvents.next, patrolsFeedMeta?.next]);

  useEffect(() => {
    debouncedLoadMoreFeedRef.current = debounce(() => {
      maybeLoadMoreFeed();
    }, 400);
    return () => debouncedLoadMoreFeedRef.current.cancel();
  }, [maybeLoadMoreFeed]);

  const onMainGridBodyScroll = useCallback((e) => {
    if (e.direction !== 'vertical') return;
    if (entity !== ENTITY.EVENTS && entity !== ENTITY.PATROLS) return;
    const api = e.api;
    if (typeof api.getLastDisplayedRowIndex !== 'function' || typeof api.getDisplayedRowCount !== 'function') {
      return;
    }
    const last = api.getLastDisplayedRowIndex();
    const total = api.getDisplayedRowCount();
    if (total === 0 || last < total - SCROLL_LOAD_EDGE_ROWS) return;
    debouncedLoadMoreFeedRef.current();
  }, [entity]);

  useEffect(() => {
    setEntity(defaultEntity);
  }, [defaultEntity]);

  useEffect(() => {
    if (entity !== ENTITY.SUBJECTS) return undefined;

    let cancelled = false;
    const load = async () => {
      setSubjectsLoading(true);
      setSubjectsError(null);
      try {
        const params = {
          include_inactive: false,
          page: 1,
          page_size: 100,
        };
        const res = await axios.get(SUBJECTS_URL, { params });
        if (cancelled) return;
        const { results } = unpackPagedResults(res);
        setSubjectRows(results);
      } catch (e) {
        if (!cancelled) {
          setSubjectsError(e);
          setSubjectRows([]);
        }
      } finally {
        if (!cancelled) {
          setSubjectsLoading(false);
        }
      }
    };

    load();
    return () => { cancelled = true; };
  }, [entity]);

  const beginGridBusy = useCallback((reason) => {
    interactionBlockedRef.current = true;
    setGridBusyReason(reason);
  }, []);

  const endGridBusy = useCallback(() => {
    interactionBlockedRef.current = false;
    setGridBusyReason(null);
  }, []);

  const ensureAllFeedPagesForExport = useCallback(async () => {
    if (entity === ENTITY.EVENTS) {
      let next = getFeedEvents(store.getState()).next;
      let pages = 0;
      while (next && pages < MAX_FEED_PAGES_PER_EXPORT) {
        await dispatch(fetchNextEventFeedPage(next));
        pages += 1;
        next = getFeedEvents(store.getState()).next;
      }
      return;
    }
    if (entity === ENTITY.PATROLS) {
      let next = readPatrolsFeedNext(store.getState());
      let pages = 0;
      while (next && pages < MAX_FEED_PAGES_PER_EXPORT) {
        await dispatch(fetchNextPatrolsFeedPage(next));
        pages += 1;
        next = readPatrolsFeedNext(store.getState());
      }
    }
  }, [dispatch, entity, store]);

  const flushGridRowData = useCallback(() => new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(resolve);
    });
  }), []);

  const runFilterBackfill = useCallback(async (generation) => {
    await flushGridRowData();

    const api = mainGridApiRef.current;
    if (!api || drillStackLengthRef.current) return;

    const ent = entityRef.current;
    if (!(ent === ENTITY.EVENTS || ent === ENTITY.PATROLS)) return;
    if (!mainGridHasActiveFilter(api)) return;

    let pages = 0;
    while (pages < FILTER_BACKFILL_MAX_PAGES) {
      if (filterBackfillGenRef.current !== generation) return;

      await flushGridRowData();

      if (filterBackfillGenRef.current !== generation) return;

      const fillTarget = getFilterBackfillTargetRows(api);
      const filteredCount = countFilteredLeafRows(api);
      const state = store.getState();
      const next = ent === ENTITY.EVENTS
        ? getFeedEvents(state).next
        : readPatrolsFeedNext(state);

      if (!shouldFetchMoreForFilteredView(filteredCount, fillTarget, !!next)) return;

      pages += 1;
      try {
        if (ent === ENTITY.EVENTS) {
          await dispatch(fetchNextEventFeedPage(next));
        } else {
          await dispatch(fetchNextPatrolsFeedPage(next));
        }
      } catch {
        return;
      }

      await flushGridRowData();
    }
  }, [dispatch, flushGridRowData, store]);

  const onMainGridFilterChanged = useCallback(() => {
    if (interactionBlockedRef.current) return;
    filterBackfillGenRef.current += 1;
    const generation = filterBackfillGenRef.current;
    if (filterBackfillTimeoutRef.current) {
      clearTimeout(filterBackfillTimeoutRef.current);
    }
    filterBackfillTimeoutRef.current = setTimeout(() => {
      filterBackfillTimeoutRef.current = null;
      void runFilterBackfill(generation);
    }, FILTER_BACKFILL_DEBOUNCE_MS);
  }, [runFilterBackfill]);

  useEffect(() => () => {
    if (filterBackfillTimeoutRef.current) {
      clearTimeout(filterBackfillTimeoutRef.current);
    }
  }, []);

  const eventColumnDefs = useMemo(() => ([
    {
      colId: 'serial_number',
      field: 'serial_number',
      flex: 0,
      headerName: t('columnSerial'),
      maxWidth: 120,
      minWidth: 64,
      width: 88,
    },
    {
      colId: 'display_title',
      flex: 2,
      headerName: t('columnTitle'),
      minWidth: 120,
      valueGetter: (p) => displayTitleForEvent(p.data, eventTypes) ?? '',
    },
    {
      colId: 'event_time',
      flex: 1,
      headerName: t('columnEventTime'),
      minWidth: 152,
      valueGetter: (p) => p.data?.time ?? '',
      cellRenderer: (params) => <DataWorkspaceEventDateCell date={params.data?.time} />,
    },
    {
      colId: 'updated_at',
      flex: 1,
      headerName: t('columnUpdatedAt'),
      minWidth: 152,
      valueGetter: (p) => p.data?.updated_at ?? '',
      cellRenderer: (params) => <DataWorkspaceEventDateCell date={params.data?.updated_at} />,
    },
  ]), [eventTypes, t]);

  const subjectColumnDefs = useMemo(() => ([
    { field: 'name', flex: 2, headerName: t('columnName'), minWidth: 120 },
    { field: 'id', headerName: t('columnId'), minWidth: 200, width: 220 },
    { field: 'subject_subtype', headerName: t('columnSubtype'), minWidth: 120, width: 140 },
    {
      headerName: t('columnLastPosition'),
      minWidth: 160,
      valueGetter: (p) => {
        const lp = p.data?.last_position;
        if (!lp) return '';
        try {
          return JSON.stringify(lp);
        } catch {
          return '';
        }
      },
    },
  ]), [t]);

  const patrolColumnDefs = useMemo(() => ([
    { field: 'id', headerName: t('columnId'), minWidth: 200, width: 220 },
    { field: 'state', headerName: t('columnState'), width: 120 },
    {
      headerName: t('columnPatrolType'),
      minWidth: 140,
      valueGetter: (p) => p.data?.patrol_type?.value ?? p.data?.patrol_type ?? '',
    },
    {
      flex: 1,
      headerName: t('columnPatrolStart'),
      minWidth: 140,
      valueGetter: (p) => p.data?.patrol_segments?.[0]?.time_range?.start_time ?? '',
    },
  ]), [t]);

  const openNestedStructureForRow = useCallback((row) => {
    if (!row || row.raw === null || typeof row.raw !== 'object') return;
    setDrillStack((s) => [...s, { label: row.field, rows: rowsFromValue(row.raw, s.length) }]);
  }, []);

  const drillColumnDefs = useMemo(() => ([
    { field: 'field', flex: 1, headerName: t('columnField'), minWidth: 120 },
    {
      field: 'valueLabel',
      flex: 2,
      headerName: t('columnValue'),
      minWidth: 160,
      cellRenderer: (params) => {
        const canDrill = params?.data?.raw !== null && typeof params?.data?.raw === 'object';

        return (
          <div className={styles.drillValueCell}>
            <span className={styles.drillValueText}>{params.value}</span>
            {canDrill && <button
              aria-label={t('openStructure')}
              className={styles.drillDownIconButton}
              onClick={(e) => {
                e.stopPropagation();
                openNestedStructureForRow(params.data);
              }}
              type="button"
            >
              <ChevronRightIcon />
            </button>}
          </div>
        );
      },
    },
  ]), [openNestedStructureForRow, t]);

  const mainRowData = useMemo(() => {
    if (entity === ENTITY.EVENTS) return feedEvents.results ?? [];
    if (entity === ENTITY.SUBJECTS) return subjectRows;
    if (entity === ENTITY.PATROLS) return sortedPatrols;
    return [];
  }, [entity, feedEvents.results, sortedPatrols, subjectRows]);

  const mainColumnDefs = useMemo(() => {
    if (entity === ENTITY.EVENTS) return eventColumnDefs;
    if (entity === ENTITY.SUBJECTS) return subjectColumnDefs;
    if (entity === ENTITY.PATROLS) return patrolColumnDefs;
    return eventColumnDefs;
  }, [entity, eventColumnDefs, patrolColumnDefs, subjectColumnDefs]);

  const entityNavLabel = useMemo(() => {
    if (entity === ENTITY.EVENTS) return t('entityEvents');
    if (entity === ENTITY.SUBJECTS) return t('entitySubjects');
    if (entity === ENTITY.PATROLS) return t('entityPatrols');
    return '';
  }, [entity, t]);

  const onEntitySelect = useCallback((key) => {
    if (!key) return;
    setEntity(key);
    setDrillStack([]);
  }, []);

  const popDrillTo = useCallback((index) => {
    if (index <= 0) {
      setDrillStack([]);
      return;
    }
    setDrillStack((s) => s.slice(0, index));
  }, []);

  const onBackOneDrill = useCallback(() => {
    setDrillStack((s) => s.slice(0, -1));
  }, []);

  const openEventStructure = useCallback(async () => {
    const row = mainGridApiRef.current?.getSelectedRows()?.[0];
    if (!row?.id) return;
    beginGridBusy('drill');
    try {
      const { data } = await axios.get(`${EVENT_API_URL}${row.id}`);
      const full = data.data;
      const label = full.title || full.serial_number || full.id;
      setDrillStack([{ label, rows: rowsFromValue(full, 0) }]);
    } catch {
      showToast({ message: t('exploreError') });
    } finally {
      endGridBusy();
    }
  }, [beginGridBusy, endGridBusy, t]);

  const openPatrolStructure = useCallback(async () => {
    const row = mainGridApiRef.current?.getSelectedRows()?.[0];
    if (!row?.id) return;
    beginGridBusy('drill');
    try {
      const { data } = await axios.get(`${PATROLS_API_URL}${row.id}`);
      const full = data.data;
      const label = full.patrol_type?.display ?? full.id;
      setDrillStack([{ label, rows: rowsFromValue(full, 0) }]);
    } catch {
      showToast({ message: t('exploreError') });
    } finally {
      endGridBusy();
    }
  }, [beginGridBusy, endGridBusy, t]);

  const openSubjectStructure = useCallback(() => {
    const row = mainGridApiRef.current?.getSelectedRows()?.[0];
    if (!row) return;
    const label = row.name || row.id;
    setDrillStack([{ label, rows: rowsFromValue(row, 0) }]);
  }, []);

  const openMainExplore = useCallback(() => {
    if (entity === ENTITY.EVENTS) return openEventStructure();
    if (entity === ENTITY.PATROLS) return openPatrolStructure();
    if (entity === ENTITY.SUBJECTS) return openSubjectStructure();
    return undefined;
  }, [entity, openEventStructure, openPatrolStructure, openSubjectStructure]);

  const openNestedStructure = useCallback(() => {
    const row = drillGridApiRef.current?.getSelectedRows()?.[0];
    openNestedStructureForRow(row);
  }, [openNestedStructureForRow]);

  const exportMainCsv = useCallback(async () => {
    if (interactionBlockedRef.current) return;
    const name = entity === ENTITY.EVENTS ? 'events' : entity === ENTITY.SUBJECTS ? 'subjects' : 'patrols';
    beginGridBusy('export');
    try {
      if (entity === ENTITY.EVENTS || entity === ENTITY.PATROLS) {
        await ensureAllFeedPagesForExport();
        await flushGridRowData();
      }
      mainGridApiRef.current?.exportDataAsCsv({
        fileName: `earthranger-${name}.csv`,
        processCellCallback: processMainGridCellForCsvExport,
      });
    } catch {
      showToast({ message: t('exportCsvError') });
    } finally {
      endGridBusy();
    }
  }, [beginGridBusy, endGridBusy, entity, ensureAllFeedPagesForExport, flushGridRowData, t]);

  const exportDrillCsv = useCallback(() => {
    drillGridApiRef.current?.exportDataAsCsv({
      fileName: 'earthranger-structure.csv',
      processCellCallback: processDrillGridCellForCsvExport,
    });
  }, []);

  const onMainGridReady = useCallback((e) => {
    mainGridApiRef.current = e.api;
  }, []);

  const onDrillGridReady = useCallback((e) => {
    drillGridApiRef.current = e.api;
  }, []);

  const onMainRowDoubleClicked = useCallback(() => {
    if (interactionBlockedRef.current) return;
    openMainExplore();
  }, [openMainExplore]);

  const onGridCellKeyDown = useCallback((e) => {
    const domEvent = e.event;
    if (!domEvent || typeof domEvent.key !== 'string') return;
    if (domEvent.key.toLowerCase() !== 'c') return;
    if (!(domEvent.ctrlKey || domEvent.metaKey)) return;
    if (!e.column) return;

    const selectedText = window.getSelection?.()?.toString() ?? '';
    if (selectedText.length > 0) return;

    domEvent.preventDefault();
    const raw = resolveValueForDataWorkspaceClipboard({
      api: e.api,
      column: e.column,
      node: e.node,
      value: e.value,
    });
    const text = serializeCellValueForExport(raw);
    void navigator.clipboard?.writeText(text).catch(() => {});
  }, []);

  useEffect(() => {
    const onKey = (event) => {
      if (event.key !== 'Escape' || drillStack.length === 0) return;
      if (!rootRef.current?.contains(document.activeElement)) return;
      event.preventDefault();
      setDrillStack((s) => s.slice(0, -1));
    };
    document.addEventListener('keydown', onKey, false);
    return () => document.removeEventListener('keydown', onKey, false);
  }, [drillStack.length]);

  const breadcrumbSegments = useMemo(() => [entityNavLabel, ...drillStack.map((d) => d.label)], [drillStack, entityNavLabel]);

  const exportDisabled = !!drillStack.length || !!gridBusyReason
    || (entity === ENTITY.PATROLS && patrolsFeed.loadingPatrolsFeed)
    || (entity === ENTITY.SUBJECTS && subjectsLoading);

  const entitySelectDisabled = !!gridBusyReason;

  const showGridBusyOverlay = !!gridBusyReason
    || (entity === ENTITY.PATROLS && patrolsFeed.loadingPatrolsFeed && !drillStack.length)
    || (entity === ENTITY.SUBJECTS && subjectsLoading && !drillStack.length);

  return <div className={styles.root} data-testid="data-workspace-root" ref={rootRef}>
    <div className={styles.entityNav} data-testid="data-entity-switcher">
      <Form.Select
        aria-label={t('entitySelectAriaLabel')}
        className={styles.entitySelect}
        data-testid="data-entity-select"
        disabled={entitySelectDisabled}
        onChange={(e) => onEntitySelect(e.target.value)}
        value={entity}
      >
        {eventsEnabled && <option value={ENTITY.EVENTS}>{t('entityEvents')}</option>}
        {subjectsEnabled && <option value={ENTITY.SUBJECTS}>{t('entitySubjects')}</option>}
        {canReadPatrols && <option value={ENTITY.PATROLS}>{t('entityPatrols')}</option>}
      </Form.Select>
    </div>

    {(entity === ENTITY.EVENTS || entity === ENTITY.PATROLS) && <div className={styles.toolbar}>
      {entity === ENTITY.EVENTS && <div className={styles.filterSlot} data-testid="data-event-filters">
        <EventFilter className={styles.embeddedEventFilter} />
      </div>}

      {entity === ENTITY.PATROLS && <div className={styles.filterSlot} data-testid="data-patrol-filters">
        <PatrolFilter />
      </div>}
    </div>}

    {!!drillStack.length && <>
      <nav aria-label={t('breadcrumbAriaLabel')}>
        <ol className={styles.breadcrumbNav} data-testid="data-breadcrumb">
          {breadcrumbSegments.map((seg, i) => <li key={`${seg}-${i}`}>
            {i > 0 && <span aria-hidden className={styles.breadcrumbSep}>/</span>}
            {i < breadcrumbSegments.length - 1
              ? <button
                className={styles.breadcrumbButton}
                onClick={() => popDrillTo(i)}
                type="button"
              >
                {seg}
              </button>
              : <span className={styles.breadcrumbCurrent}>{seg}</span>}
          </li>)}
        </ol>
      </nav>

      <div className={styles.drillToolbar}>
        <Button
          data-testid="data-drill-back-button"
          onClick={onBackOneDrill}
          type="button"
          variant="outline-secondary"
        >
          {t('back')}
        </Button>
        <Button
          data-testid="data-drill-export-csv-button"
          onClick={exportDrillCsv}
          type="button"
          variant="outline-secondary"
        >
          {t('exportCsv')}
        </Button>
      </div>
    </>}

    <div className={styles.gridHost} data-testid="data-grid-host">
      {!drillStack.length && <div className={styles.gridToolbar}>
        <KebabMenu
          align="end"
          aria-label={t('dataViewMenuLabel')}
          data-testid="data-view-kebab-menu"
          title={t('dataViewMenuTitle')}
        >
          <KebabMenu.Option
            as="button"
            data-testid="data-export-csv-button"
            disabled={exportDisabled}
            onClick={exportMainCsv}
          >
            {t('exportCsv')}
          </KebabMenu.Option>
        </KebabMenu>
      </div>}

      <div className={styles.gridWrapper} data-testid="data-grid-wrapper">
        {entity === ENTITY.SUBJECTS && subjectsError && <div className={styles.emptyHint}>{t('loadError')}</div>}

        {!drillStack.length && !(entity === ENTITY.SUBJECTS && subjectsLoading) && <div
          className={`ag-theme-alpine ${styles.gridInner}`}
          data-testid="data-entity-grid"
        >
          <AgGridReact
            columnDefs={mainColumnDefs}
            defaultColDef={defaultColDef}
            enableCellTextSelection
            ensureDomOrder
            getRowId={(p) => String(p.data?.id ?? `row-${p.node?.id}`)}
            onBodyScroll={onMainGridBodyScroll}
            onCellKeyDown={onGridCellKeyDown}
            onFilterChanged={onMainGridFilterChanged}
            onGridReady={onMainGridReady}
            onRowDoubleClicked={onMainRowDoubleClicked}
            rowData={mainRowData}
            rowSelection="single"
          />
        </div>}

        {!!drillStack.length && <div
          className={`ag-theme-alpine ${styles.gridInner}`}
          data-testid="data-drill-grid"
        >
          <AgGridReact
            columnDefs={drillColumnDefs}
            defaultColDef={defaultColDef}
            enableCellTextSelection
            ensureDomOrder
            getRowId={(p) => p.data.rowKey}
            onCellKeyDown={onGridCellKeyDown}
            onGridReady={onDrillGridReady}
            onRowDoubleClicked={openNestedStructure}
            rowData={drillStack[drillStack.length - 1].rows}
            rowSelection="single"
          />
        </div>}

        {showGridBusyOverlay && <div
          aria-busy="true"
          aria-live="polite"
          className={styles.gridBusyOverlay}
          data-testid="data-grid-busy-overlay"
        >
          <MoonLoader size={40} />
        </div>}
      </div>
    </div>
  </div>;
};

export default DataWorkspace;
