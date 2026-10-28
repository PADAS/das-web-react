import { useCallback, useMemo, useRef, useState } from 'react';
import Button from 'react-bootstrap/Button';
import startCase from 'lodash/startCase';
import uniq from 'lodash/uniq';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { API_URL, EVENT_FORM_STATES, EVENT_SORT_OPTIONS, SORT_DIRECTION, TAB_KEYS } from '../constants';
import {
  calcDisplayPriorityForReport,
  displayTitleForEvent,
  eventTypeTitleForEvent,
  getCoordinatesForCollection,
  getCoordinatesForEvent,
  PRIORITY_COLOR_MAP,
} from '../utils/events';
import { calcEventFilterForRequest } from '../utils/event-filter';
import { downloadFileFromUrl } from '../utils/download';
import { fetchNextEventFeedPage, setEventState } from '../ducks/events';
import { showToast } from '../utils/toast';
import { updateEventFilter } from '../ducks/event-filter';
import useJumpToLocation from '../hooks/useJumpToLocation';
import useNavigate from '../hooks/useNavigate';

import DateTime from '../DateTime';
import FeedTable from '.';

import * as styles from './styles.module.scss';

const STATE_KEY_BY_EVENT_STATE = {
  [EVENT_FORM_STATES.ACTIVE]: EVENT_FORM_STATES.ACTIVE,
  [EVENT_FORM_STATES.NEW_LEGACY]: EVENT_FORM_STATES.ACTIVE,
  [EVENT_FORM_STATES.RESOLVED]: EVENT_FORM_STATES.RESOLVED,
  [EVENT_FORM_STATES.REVIEW]: EVENT_FORM_STATES.REVIEW,
};

const formatDetailValue = (value) => {
  if (value === null || value === undefined) return '';
  if (Array.isArray(value)) return value.map(formatDetailValue).join(', ');
  if (typeof value === 'object') return value.name ?? value.title ?? value.value ?? JSON.stringify(value);
  return String(value);
};

const formatCoordinates = (coordinates) => {
  if (!Array.isArray(coordinates) || typeof coordinates[0] !== 'number') return '';
  const [longitude, latitude] = coordinates;
  return `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
};

const DateCell = ({ value }) => value ? <DateTime className={styles.dateCell} date={value} showElapsed={false} /> : null;

const PriorityCell = ({ value, valueFormatted }) => <span className={styles.priorityCell}>
  <span
    aria-hidden
    className={styles.priorityDot}
    style={{ backgroundColor: (PRIORITY_COLOR_MAP[value] ?? PRIORITY_COLOR_MAP[0]).base }}
  />
  {valueFormatted}
</span>;

const EventsTable = ({ events, eventsFeed, toolbarContainer }) => {
  const dispatch = useDispatch();
  const jumpToLocation = useJumpToLocation();
  const navigate = useNavigate();
  const { t } = useTranslation('components', { keyPrefix: 'feedTable' });
  const { t: tPriorities } = useTranslation('reports', { keyPrefix: 'reportManager.detailsSection.priorities' });
  const { t: tStates } = useTranslation('reports', { keyPrefix: 'eventsManager.eventsFeed.eventRow.states' });

  const eventSort = useSelector((state) => state.data.eventFilter.filter.sort);
  const eventTypeFilter = useSelector((state) => state.data.eventFilter.filter.event_type);
  const eventTypes = useSelector((state) => state.data.eventTypes);

  const loadingMoreRef = useRef(false);

  const [updatingState, setUpdatingState] = useState(false);

  const [sortDirection, sortOption] = eventSort;

  // Only what the events API orders by is sortable, so a sort covers every
  // page, not just the loaded ones. It is the feed's own sort.
  const serverSortable = useCallback((sortValue) => ({
    sort: sortOption.value === sortValue ? (sortDirection === SORT_DIRECTION.up ? 'asc' : 'desc') : null,
    sortable: true,
    sortingOrder: ['desc', 'asc'],
  }), [sortDirection, sortOption.value]);

  // Filtered to one event type, the feed loads event details, and each field
  // gets a column.
  const detailColumns = useMemo(() => {
    if (eventTypeFilter.length !== 1) return [];

    return uniq(events.flatMap((event) => Object.keys(event.event_details ?? {}))).map((key) => ({
      colId: `event_details.${key}`,
      headerName: startCase(key),
      minWidth: 140,
      valueGetter: (params) => formatDetailValue(params.data?.event_details?.[key]),
    }));
  }, [eventTypeFilter.length, events]);

  const columnDefs = useMemo(() => [
    {
      cellRenderer: PriorityCell,
      colId: 'priority',
      headerName: t('columnPriority'),
      minWidth: 110,
      valueFormatter: (params) => tPriorities((PRIORITY_COLOR_MAP[params.value] ?? PRIORITY_COLOR_MAP[0]).key),
      valueGetter: (params) => calcDisplayPriorityForReport(params.data, eventTypes) || 0,
      width: 120,
    },
    {
      colId: 'serial_number',
      field: 'serial_number',
      headerName: t('columnSerial'),
      minWidth: 80,
      width: 100,
      ...serverSortable('serial_number'),
    },
    {
      colId: 'title',
      flex: 2,
      headerName: t('columnTitle'),
      minWidth: 180,
      valueGetter: (params) => displayTitleForEvent(params.data, eventTypes) ?? '',
    },
    {
      colId: 'event_type',
      flex: 1,
      headerName: t('columnEventType'),
      minWidth: 140,
      valueGetter: (params) => eventTypeTitleForEvent(params.data, eventTypes) ?? '',
    },
    {
      colId: 'state',
      headerName: t('columnState'),
      minWidth: 100,
      valueGetter: (params) => {
        const stateKey = STATE_KEY_BY_EVENT_STATE[params.data?.state];
        return stateKey ? tStates(stateKey) : params.data?.state ?? '';
      },
      width: 110,
    },
    {
      colId: 'reported_by',
      headerName: t('columnReportedBy'),
      minWidth: 140,
      valueGetter: (params) => params.data?.reported_by?.name ?? '',
    },
    {
      cellRenderer: DateCell,
      colId: 'event_time',
      headerName: t('columnEventTime'),
      minWidth: 170,
      valueGetter: (params) => params.data?.time ?? '',
      ...serverSortable('event_time'),
    },
    {
      cellRenderer: DateCell,
      colId: 'updated_at',
      field: 'updated_at',
      headerName: t('columnUpdatedAt'),
      minWidth: 170,
      ...serverSortable('updated_at'),
    },
    {
      cellRenderer: DateCell,
      colId: 'created_at',
      defaultHidden: true,
      field: 'created_at',
      headerName: t('columnCreatedAt'),
      minWidth: 170,
      ...serverSortable('created_at'),
    },
    {
      colId: 'location',
      defaultHidden: true,
      headerName: t('columnLocation'),
      minWidth: 170,
      valueGetter: (params) => formatCoordinates(getCoordinatesForEvent(params.data)),
    },
    ...detailColumns,
  ], [detailColumns, eventTypes, serverSortable, t, tPriorities, tStates]);

  const onSortChanged = (event) => {
    if (event.source !== 'uiColumnSorted') return;

    const sortedColumn = event.api.getColumnState().find((column) => !!column.sort);
    const option = EVENT_SORT_OPTIONS.find((sortOption) => sortOption.value === sortedColumn?.colId);
    if (option) {
      const direction = sortedColumn.sort === 'asc' ? SORT_DIRECTION.up : SORT_DIRECTION.down;
      dispatch(updateEventFilter({ filter: { sort: [direction, option] } }));
    }
  };

  const onLoadMore = () => {
    const { next } = eventsFeed.events;
    if (loadingMoreRef.current || !next) return;

    loadingMoreRef.current = true;
    dispatch(fetchNextEventFeedPage(next)).finally(() => {
      loadingMoreRef.current = false;
    });
  };

  // The same export as the menu's Field Events report: every event matching the feed filter, with its details.
  const onExport = () => downloadFileFromUrl(`${API_URL}activity/events/export?${calcEventFilterForRequest()}`, {});

  const onOpenRow = (event) => {
    navigate(`/${TAB_KEYS.EVENTS}/${event.id}`);

    const coordinates = event.is_collection ? getCoordinatesForCollection(event) : getCoordinatesForEvent(event);
    if (coordinates?.length) {
      jumpToLocation(coordinates);
    }
  };

  const setSelectedEventsState = async (selectedEvents, state, clearSelection) => {
    setUpdatingState(true);

    const results = await Promise.allSettled(selectedEvents.map((event) => dispatch(setEventState(event.id, state))));
    const failedCount = results.filter((result) => result.status === 'rejected').length;

    showToast(failedCount
      ? { message: t('bulkStateError', { count: failedCount }) }
      : { message: t('bulkStateSuccess', { count: selectedEvents.length }), toastConfig: { type: 'success' } });

    setUpdatingState(false);
    clearSelection();
    eventsFeed.loadFeedEvents(true);
  };

  const renderBulkActions = (selectedEvents, clearSelection) => <>
    <Button
      disabled={updatingState}
      onClick={() => setSelectedEventsState(selectedEvents, EVENT_FORM_STATES.RESOLVED, clearSelection)}
      size="sm"
      type="button"
      variant="outline-secondary"
    >
      {t('resolveSelected')}
    </Button>

    <Button
      disabled={updatingState}
      onClick={() => setSelectedEventsState(selectedEvents, EVENT_FORM_STATES.ACTIVE, clearSelection)}
      size="sm"
      type="button"
      variant="outline-secondary"
    >
      {t('reopenSelected')}
    </Button>
  </>;

  return <FeedTable
    columnDefs={columnDefs}
    getRowId={(params) => params.data.id}
    loading={eventsFeed.loadingEventFeed}
    onExport={onExport}
    onLoadMore={onLoadMore}
    onOpenRow={onOpenRow}
    onSortChanged={onSortChanged}
    renderBulkActions={renderBulkActions}
    rowData={events}
    tableKey={TAB_KEYS.EVENTS}
    toolbarContainer={toolbarContainer}
  />;
};

export default EventsTable;
