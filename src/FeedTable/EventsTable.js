import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Button from 'react-bootstrap/Button';
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
import { addModal } from '../ducks/modals';
import { downloadFileFromUrl } from '../utils/download';
import { fetchEventTypeSchema } from '../ducks/event-schemas';
import { fetchNextEventFeedPage, setEventState } from '../ducks/events';
import { fieldsFromEventDetails, fieldsFromV1Schema, fieldsFromV2Schema } from './eventTypeFields';
import { selectCoordinatesRepresentation } from '../selectors/location';
import { selectEventSchema } from '../selectors/event-schemas';
import { showToast } from '../utils/toast';
import { updateEventFilter } from '../ducks/event-filter';
import useJumpToLocation from '../hooks/useJumpToLocation';
import useNavigate from '../hooks/useNavigate';

import DateTime from '../DateTime';
import FeedTable from '.';
import ObjectViewModal, { ObjectValueLink } from './ObjectViewModal';

import * as styles from './styles.module.scss';

const STATE_KEY_BY_EVENT_STATE = {
  [EVENT_FORM_STATES.ACTIVE]: EVENT_FORM_STATES.ACTIVE,
  [EVENT_FORM_STATES.NEW_LEGACY]: EVENT_FORM_STATES.ACTIVE,
  [EVENT_FORM_STATES.RESOLVED]: EVENT_FORM_STATES.RESOLVED,
  [EVENT_FORM_STATES.REVIEW]: EVENT_FORM_STATES.REVIEW,
};

// The v2 schema endpoint answers in the v1 shape for v1 types, so the shape decides.
const calcEventTypeFields = (eventSchema, events, coordinatesRepresentation) => {
  try {
    if (eventSchema?.json) return fieldsFromV2Schema(eventSchema, coordinatesRepresentation);
    if (eventSchema?.schema) return fieldsFromV1Schema(eventSchema);
  } catch (error) {
    console.warn('Could not read the event type schema for the table columns', error);
  }
  return fieldsFromEventDetails(events);
};

const formatCoordinates = (coordinates) => {
  if (!Array.isArray(coordinates) || typeof coordinates[0] !== 'number') return '';
  const [longitude, latitude] = coordinates;
  return `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
};

const DateCell = ({ value }) => value ? <DateTime className={styles.dateCell} date={value} showElapsed={false} /> : null;

const ComplexDetailCell = ({ colDef, value }) => {
  const dispatch = useDispatch();

  if (value === null || value === undefined || typeof value !== 'object') return null;

  return <ObjectValueLink
    onOpen={() => dispatch(addModal({ content: ObjectViewModal, title: colDef.headerName, value }))}
    value={value}
  />;
};

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
  const coordinatesRepresentation = useSelector(selectCoordinatesRepresentation);

  // Filtered to one event type, each of its fields gets a column.
  const filteredEventType = eventTypeFilter.length === 1
    ? eventTypes.find((eventType) => eventType.id === eventTypeFilter[0])
    : null;
  const eventSchema = useSelector((state) => filteredEventType
    ? selectEventSchema(state, filteredEventType.value)
    : null);

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

  useEffect(() => {
    if (filteredEventType && !eventSchema) {
      dispatch(fetchEventTypeSchema(filteredEventType.value));
    }
  }, [dispatch, eventSchema, filteredEventType]);

  // Columns come from the type's schema, so every field is listed even when the
  // loaded events leave it empty; the loaded details are the fallback.
  const detailColumns = useMemo(() => {
    if (eventTypeFilter.length !== 1) return [];

    return calcEventTypeFields(eventSchema, events, coordinatesRepresentation).map((field) => ({
      colId: `event_details.${field.key}`,
      headerName: field.label,
      minWidth: 140,
      ...(field.complex
        ? {
          cellDataType: false,
          cellRenderer: ComplexDetailCell,
          valueGetter: (params) => params.data?.event_details?.[field.key],
        }
        : { valueGetter: (params) => field.toText(params.data?.event_details) }),
      ...(field.isDate && { cellRenderer: DateCell }),
    }));
  }, [coordinatesRepresentation, eventSchema, eventTypeFilter.length, events]);

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
