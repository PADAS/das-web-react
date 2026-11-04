import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { API_URL, EVENT_FORM_STATES, EVENT_SORT_OPTIONS, SORT_DIRECTION, TAB_KEYS } from '../../constants';
import {
  addPatrolSegmentToEvent,
  calcDisplayPriorityForReport,
  createNewIncidentCollection,
  displayTitleForEvent,
  eventBelongsToCollection,
  eventBelongsToPatrol,
  eventTypeTitleForEvent,
  getCoordinatesForCollection,
  getCoordinatesForEvent,
  PRIORITY_COLOR_MAP,
} from '../../utils/events';
import { calcEventFilterForRequest } from '../../utils/event-filter';
import { addModal } from '../../ducks/modals';
import { downloadFileFromUrl } from '../../utils/download';
import { fetchEventTypeSchema } from '../../ducks/event-schemas';
import { addEventToIncident, createEvent, fetchNextEventFeedPage, setEventState } from '../../ducks/events';
import { governingPatrolSegment } from '../../utils/patrols';
import { selectCoordinatesRepresentation } from '../../selectors/location';
import { selectEventSchema } from '../../selectors/event-schemas';
import { showToast } from '../../utils/toast';
import { updateEventFilter } from '../../ducks/event-filter';
import useJumpToLocation from '../../hooks/useJumpToLocation';
import useNavigate from '../../hooks/useNavigate';
import calcEventTypeFields from './utils/calcEventTypeFields';

import AddToIncidentModal from '../../AddToIncidentModal';
import AddToPatrolModal from '../../AddToPatrolModal';
import CollectionViewModal from './CollectionViewModal';
import FeedTable, { formatDateValue } from '..';
import ObjectViewModal, { ObjectValueLink } from '../ObjectViewModal';

import * as styles from './styles.module.scss';

const EMPTY_COLUMNS = [];
const EMPTY_EVENTS = [];

const STATE_KEY_BY_EVENT_STATE = {
  [EVENT_FORM_STATES.ACTIVE]: EVENT_FORM_STATES.ACTIVE,
  [EVENT_FORM_STATES.NEW_LEGACY]: EVENT_FORM_STATES.ACTIVE,
  [EVENT_FORM_STATES.RESOLVED]: EVENT_FORM_STATES.RESOLVED,
  [EVENT_FORM_STATES.REVIEW]: EVENT_FORM_STATES.REVIEW,
};

const formatCoordinates = (coordinates) => {
  if (!Array.isArray(coordinates) || typeof coordinates[0] !== 'number') return '';
  const [longitude, latitude] = coordinates;
  return `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
};

// A v2 collection opens in the form's own read-only view; other objects, without
// a schema to label them, open in the generic object view.
const ComplexDetailCell = ({ colDef, eventSchema, fieldName, value }) => {
  const dispatch = useDispatch();

  if (value === null || value === undefined || typeof value !== 'object') return null;

  return <ObjectValueLink
    onOpen={() => dispatch(addModal(eventSchema
      ? { content: CollectionViewModal, fieldName, schema: eventSchema, title: colDef.headerName, value }
      : { content: ObjectViewModal, title: colDef.headerName, value }))}
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
  const { t: tReportMenu } = useTranslation('reports', { keyPrefix: 'eventsManager.eventOverview.header.reportMenu' });
  const { t: tSideBar } = useTranslation('components', { keyPrefix: 'sideBar' });
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

  // Only the schemaless fallback reads the loaded events, so new events don't
  // rebuild the columns of a type with a schema.
  const eventsForFallbackColumns = eventSchema?.json || eventSchema?.schema ? EMPTY_EVENTS : events;

  // Columns come from the type's schema, so every field is listed even when the
  // loaded events leave it empty; the loaded details are the fallback.
  const detailColumns = useMemo(() => {
    if (eventTypeFilter.length !== 1) return EMPTY_COLUMNS;

    return calcEventTypeFields(eventSchema, eventsForFallbackColumns, coordinatesRepresentation).map((field) => ({
      colId: `event_details.${field.key}`,
      headerName: field.label,
      layoutScoped: true,
      minWidth: 140,
      ...(field.complex
        ? {
          cellDataType: false,
          cellRenderer: ComplexDetailCell,
          cellRendererParams: { eventSchema: eventSchema?.json ? eventSchema : null, fieldName: field.key },
          valueGetter: (params) => params.data?.event_details?.[field.key],
        }
        : { valueGetter: (params) => field.toText(params.data?.event_details) }),
      ...(field.isDate && { valueFormatter: formatDateValue }),
    }));
  }, [coordinatesRepresentation, eventSchema, eventTypeFilter.length, eventsForFallbackColumns]);

  const columnDefs = useMemo(() => [
    {
      cellRenderer: PriorityCell,
      colId: 'priority',
      headerName: t('priorityColumnTitle'),
      minWidth: 110,
      valueFormatter: (params) => tPriorities((PRIORITY_COLOR_MAP[params.value] ?? PRIORITY_COLOR_MAP[0]).key),
      valueGetter: (params) => calcDisplayPriorityForReport(params.data, eventTypes) || 0,
      width: 120,
    },
    {
      colId: 'serial_number',
      field: 'serial_number',
      headerName: t('serialColumnTitle'),
      minWidth: 80,
      width: 100,
      ...serverSortable('serial_number'),
    },
    {
      colId: 'title',
      flex: 2,
      headerName: t('titleColumnTitle'),
      minWidth: 180,
      valueGetter: (params) => displayTitleForEvent(params.data, eventTypes) ?? '',
    },
    {
      colId: 'event_type',
      flex: 1,
      headerName: t('eventTypeColumnTitle'),
      minWidth: 140,
      valueGetter: (params) => eventTypeTitleForEvent(params.data, eventTypes) ?? '',
    },
    {
      colId: 'state',
      headerName: t('stateColumnTitle'),
      minWidth: 100,
      valueGetter: (params) => {
        const stateKey = STATE_KEY_BY_EVENT_STATE[params.data?.state];
        return stateKey ? tStates(stateKey) : params.data?.state ?? '';
      },
      width: 110,
    },
    {
      colId: 'reported_by',
      headerName: t('reportedByColumnTitle'),
      minWidth: 140,
      valueGetter: (params) => params.data?.reported_by?.name ?? '',
    },
    {
      valueFormatter: formatDateValue,
      colId: 'event_time',
      headerName: t('eventTimeColumnTitle'),
      minWidth: 170,
      valueGetter: (params) => params.data?.time ?? '',
      ...serverSortable('event_time'),
    },
    {
      valueFormatter: formatDateValue,
      colId: 'updated_at',
      field: 'updated_at',
      headerName: t('updatedAtColumnTitle'),
      minWidth: 170,
      ...serverSortable('updated_at'),
    },
    {
      valueFormatter: formatDateValue,
      colId: 'created_at',
      defaultHidden: true,
      field: 'created_at',
      headerName: t('createdAtColumnTitle'),
      minWidth: 170,
      ...serverSortable('created_at'),
    },
    {
      colId: 'location',
      defaultHidden: true,
      headerName: t('locationColumnTitle'),
      minWidth: 170,
      valueGetter: (params) => formatCoordinates(getCoordinatesForEvent(params.data)),
    },
    ...detailColumns,
  ], [detailColumns, eventTypes, serverSortable, t, tPriorities, tStates]);

  const getRowClass = useCallback(
    (params) => styles[(PRIORITY_COLOR_MAP[calcDisplayPriorityForReport(params.data, eventTypes)] ?? PRIORITY_COLOR_MAP[0]).key],
    [eventTypes]
  );

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
  const onExport = () => downloadFileFromUrl(
    `${API_URL}activity/events/export?${calcEventFilterForRequest({}, eventSort)}`,
    {}
  );

  const onOpenRow = (event) => {
    navigate(`/${TAB_KEYS.EVENTS}/${event.id}`);

    const coordinates = event.is_collection ? getCoordinatesForCollection(event) : getCoordinatesForEvent(event);
    if (coordinates?.length) {
      jumpToLocation(coordinates);
    }
  };

  const updateSelectedEvents = async (selectedEvents, updateEvent, clearSelection) => {
    setUpdatingState(true);

    const results = await Promise.allSettled(selectedEvents.map(updateEvent));
    const failedCount = results.filter((result) => result.status === 'rejected').length;

    showToast(failedCount
      ? { message: t('bulkUpdateErrorMessage', { count: failedCount }) }
      : { message: t('bulkUpdateSuccessMessage', { count: selectedEvents.length }), toastConfig: { type: 'success' } });

    setUpdatingState(false);
    clearSelection();
    eventsFeed.loadFeedEvents(true);
  };

  const setSelectedEventsState = (selectedEvents, state, clearSelection) => updateSelectedEvents(
    selectedEvents,
    (event) => dispatch(setEventState(event.id, state)),
    clearSelection
  );

  // The same rules as the event's own menu: an event joins one patrol, and an
  // incident can't join another or be in two.
  const onStartAddSelectedToPatrol = (selectedEvents, clearSelection) => dispatch(addModal({
    content: AddToPatrolModal,
    onAddToPatrol: (patrol) => {
      const patrolSegmentId = governingPatrolSegment(patrol)?.id;

      return updateSelectedEvents(selectedEvents, (event) => !patrolSegmentId || eventBelongsToPatrol(event)
        ? Promise.reject(new Error('The event cannot be added to this patrol'))
        : addPatrolSegmentToEvent(patrolSegmentId, event.id), clearSelection);
    },
  }));

  const addSelectedToIncident = async (selectedEvents, existingIncident, clearSelection) => {
    const canJoinIncident = (event) => !event.is_collection && !eventBelongsToCollection(event);

    let incident = existingIncident;
    if (!incident && selectedEvents.some(canJoinIncident)) {
      try {
        incident = (await dispatch(createEvent(createNewIncidentCollection()))).data.data;
      } catch {
        showToast({ message: t('bulkUpdateErrorMessage', { count: selectedEvents.length }) });
        return;
      }
    }

    await updateSelectedEvents(selectedEvents, (event) => incident && canJoinIncident(event)
      ? dispatch(addEventToIncident(event.id, incident.id))
      : Promise.reject(new Error('The event cannot be added to an incident')), clearSelection);
  };

  const onStartAddSelectedToIncident = (selectedEvents, clearSelection) => dispatch(addModal({
    content: AddToIncidentModal,
    onAddToExistingIncident: (incident) => addSelectedToIncident(selectedEvents, incident, clearSelection),
    onAddToNewIncident: () => addSelectedToIncident(selectedEvents, null, clearSelection),
  }));

  const renderBulkActions = (selectedEvents, clearSelection) => <>
    <button
      className={styles.bulkActionButton}
      disabled={updatingState}
      onClick={() => setSelectedEventsState(selectedEvents, EVENT_FORM_STATES.RESOLVED, clearSelection)}
      type="button"
    >
      {t('resolveButtonLabel')}
    </button>

    <button
      className={styles.bulkActionButton}
      disabled={updatingState}
      onClick={() => setSelectedEventsState(selectedEvents, EVENT_FORM_STATES.ACTIVE, clearSelection)}
      type="button"
    >
      {t('reopenButtonLabel')}
    </button>

    <button
      className={styles.bulkActionButton}
      disabled={updatingState}
      onClick={() => onStartAddSelectedToPatrol(selectedEvents, clearSelection)}
      type="button"
    >
      {tReportMenu('addToPatrolOption')}
    </button>

    <button
      className={styles.bulkActionButton}
      disabled={updatingState}
      onClick={() => onStartAddSelectedToIncident(selectedEvents, clearSelection)}
      type="button"
    >
      {tReportMenu('addToIncidentOption')}
    </button>
  </>;

  return <FeedTable
    ariaLabel={tSideBar('eventsLink')}
    columnDefs={columnDefs}
    getRowClass={getRowClass}
    getRowId={(params) => params.data.id}
    layoutScope={eventTypeFilter.length === 1 ? eventTypeFilter[0] : undefined}
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
