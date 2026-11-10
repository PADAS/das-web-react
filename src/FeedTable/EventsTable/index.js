import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import omit from 'lodash/omit';
import uniqBy from 'lodash/uniqBy';
import { useDispatch, useSelector, useStore } from 'react-redux';
import { useTranslation } from 'react-i18next';

import {
  API_URL,
  EVENT_FORM_STATES,
  EVENT_LINK_TARGET_TYPES,
  EVENT_SORT_OPTIONS,
  SORT_DIRECTION,
  TAB_KEYS,
} from '../../constants';
import {
  calcDisplayPriorityForReport,
  createNewIncidentCollection,
  displayTitleForEvent,
  eventTypeTitleForEvent,
  getCoordinatesForCollection,
  getCoordinatesForEvent,
  PRIORITY_COLOR_MAP,
} from '../../utils/events';
import { calcEventFilterForRequest } from '../../utils/event-filter';
import { addModal } from '../../ducks/modals';
import { downloadFileFromUrl } from '../../utils/download';
import { fetchEventTypeSchema } from '../../ducks/event-schemas';
import {
  addEventToIncident,
  addEventToPatrol,
  createEvent,
  EVENTS_API_URL,
  fetchFeedTableEventsPage,
  fetchNextEventFeedPage,
  setEventState,
} from '../../ducks/events';
import { objectToParamString } from '../../utils/query';
import { selectCoordinatesRepresentation } from '../../selectors/location';
import { stringifyCoordinates } from '../../utils/location';
import { selectEventCategoryPermissions } from '../../selectors/event-types';
import { selectEventLinkPermissions } from '../../selectors/event-links';
import { selectEventSchema } from '../../selectors/event-schemas';
import { setFeedTableClientSort } from '../../ducks/feed-table-sort';
import { showToast } from '../../utils/toast';
import { updateEventFilter } from '../../ducks/event-filter';
import useFeedTableFullLoad from '../useFeedTableFullLoad';
import useJumpToLocation from '../../hooks/useJumpToLocation';
import useNavigate from '../../hooks/useNavigate';
import calcEventTypeFields from './utils/calcEventTypeFields';

import CollectionViewModal from './CollectionViewModal';
import DelayedUnmount from '../../DelayedUnmount';
import EventIcon from '../../EventIcon';
import FeedTable, { formatDateValue, TITLE_COLUMN } from '..';
import LinkEventModal from '../../LinkEventModal';
import ObjectViewModal, { ObjectValueLink } from '../ObjectViewModal';

import * as styles from './styles.module.scss';

const BULK_UPDATE_BATCH_SIZE = 5;

const EMPTY_COLUMNS = [];
const EMPTY_EVENTS = [];

export const FULL_LOAD_PAGE_SIZE = 1000;

const STATE_KEY_BY_EVENT_STATE = {
  [EVENT_FORM_STATES.ACTIVE]: EVENT_FORM_STATES.ACTIVE,
  [EVENT_FORM_STATES.NEW_LEGACY]: EVENT_FORM_STATES.ACTIVE,
  [EVENT_FORM_STATES.RESOLVED]: EVENT_FORM_STATES.RESOLVED,
  [EVENT_FORM_STATES.REVIEW]: EVENT_FORM_STATES.REVIEW,
};

// A collection's state carries to the events it contains, as in the feed.
const getContainedEvents = (event) => (event.contains ?? []).map(({ related_event: relatedEvent }) => relatedEvent);

// Settles like Promise.allSettled, but sends only a few updates at a time.
const settleInBatches = async (items, update) => {
  const results = [];
  for (let index = 0; index < items.length; index += BULK_UPDATE_BATCH_SIZE) {
    results.push(...await Promise.allSettled(items.slice(index, index + BULK_UPDATE_BATCH_SIZE).map(update)));
  }
  return results;
};

const calcPointCoordinates = (event) => {
  const coordinates = getCoordinatesForEvent(event);

  return Array.isArray(coordinates) && typeof coordinates[0] === 'number' ? coordinates : null;
};

// North to south, then west to east, whatever format the user reads them in.
// Events without a location go last.
const compareCoordinates = (first, second) => {
  if (!first || !second) return !first - !second;
  return first[1] - second[1] || first[0] - second[0];
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

const getEventPath = (event) => `/${TAB_KEYS.EVENTS}/${event.id}`;

const selectEventStore = (state) => state.data.eventStore;

const renderEventIcon = (event) => <EventIcon report={event} />;

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
  const store = useStore();
  const { t } = useTranslation('components', { keyPrefix: 'feedTable' });
  const { t: tPriorities } = useTranslation('reports', { keyPrefix: 'reportManager.detailsSection.priorities' });
  const { t: tReportMenu } = useTranslation('reports', { keyPrefix: 'eventsManager.eventOverview.header.reportMenu' });
  const { t: tSideBar } = useTranslation('components', { keyPrefix: 'sideBar' });
  const { t: tStates } = useTranslation('reports', { keyPrefix: 'eventsManager.eventsFeed.eventRow.states' });

  const clientSortState = useSelector((state) => state.view.feedTableSort[TAB_KEYS.EVENTS].clientSort);
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

  const loadingPageUrlRef = useRef(null);

  const [isUpdatingState, setIsUpdatingState] = useState(false);
  const [linkModal, setLinkModal] = useState({ events: [], show: false, type: EVENT_LINK_TARGET_TYPES.PATROL });

  // A new feed sort, from the sort controls or a header, takes over.
  const clientSort = clientSortState?.feedSort === eventSort ? clientSortState : null;
  const [sortDirection, sortOption] = eventSort;

  // The cursor keeps its place while events change, and its fixed order
  // doesn't matter to a sort made in the browser.
  const fullLoadUrl = eventsFeed.feedRequest.params && `${EVENTS_API_URL}?${objectToParamString({
    ...omit(eventsFeed.feedRequest.params, 'sort_by'),
    page_size: FULL_LOAD_PAGE_SIZE,
    use_cursor: true,
  })}`;

  const fullLoad = useFeedTableFullLoad({
    fetchPage: fetchFeedTableEventsPage,
    firstPageUrl: fullLoadUrl,
    hasMorePages: !!eventsFeed.events.next,
    isEnabled: !!clientSort && !!fullLoadUrl,
    loadId: eventsFeed.feedRequest.id,
    rows: events,
    selectStore: selectEventStore,
    tab: TAB_KEYS.EVENTS,
  });

  // What the events API orders by is the feed's own sort, and covers every page.
  const serverSortable = useCallback((sortValue) => ({
    serverSorted: true,
    sort: !clientSort && sortOption.value === sortValue ? (sortDirection === SORT_DIRECTION.up ? 'asc' : 'desc') : null,
    sortable: true,
    sortingOrder: ['desc', 'asc'],
  }), [clientSort, sortDirection, sortOption.value]);

  const clientSortable = useCallback((colId) => ({
    sort: clientSort?.colId === colId ? clientSort.sort : null,
    sortable: true,
  }), [clientSort]);

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
        : { ...clientSortable(`event_details.${field.key}`), valueGetter: (params) => field.toText(params.data?.event_details) }),
      ...(field.isDate && { valueFormatter: formatDateValue }),
    }));
  }, [clientSortable, coordinatesRepresentation, eventSchema, eventTypeFilter.length, eventsForFallbackColumns]);

  const columnDefs = useMemo(() => [
    {
      ...TITLE_COLUMN,
      cellRendererParams: { renderIcon: renderEventIcon },
      ...clientSortable('title'),
      headerName: t('titleColumnTitle'),
      valueGetter: (params) => displayTitleForEvent(params.data, eventTypes) ?? '',
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
      colId: 'event_type',
      ...clientSortable('event_type'),
      flex: 1,
      headerName: t('eventTypeColumnTitle'),
      minWidth: 160,
      valueGetter: (params) => eventTypeTitleForEvent(params.data, eventTypes) ?? '',
    },
    {
      colId: 'reported_by',
      ...clientSortable('reported_by'),
      headerName: t('reportedByColumnTitle'),
      minWidth: 140,
      valueGetter: (params) => params.data?.reported_by?.name ?? '',
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
      colId: 'event_time',
      headerName: t('eventTimeColumnTitle'),
      minWidth: 170,
      valueGetter: (params) => params.data?.time ?? '',
      ...serverSortable('event_time'),
    },
    {
      cellRenderer: PriorityCell,
      colId: 'priority',
      ...clientSortable('priority'),
      defaultHidden: true,
      headerName: t('priorityColumnTitle'),
      minWidth: 110,
      valueFormatter: (params) => tPriorities((PRIORITY_COLOR_MAP[params.value] ?? PRIORITY_COLOR_MAP[0]).key),
      valueGetter: (params) => calcDisplayPriorityForReport(params.data, eventTypes) || 0,
      width: 120,
    },
    {
      colId: 'state',
      ...clientSortable('state'),
      defaultHidden: true,
      headerName: t('stateColumnTitle'),
      minWidth: 100,
      valueGetter: (params) => {
        const stateKey = STATE_KEY_BY_EVENT_STATE[params.data?.state];
        return stateKey ? tStates(stateKey) : params.data?.state ?? '';
      },
      width: 110,
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
      comparator: compareCoordinates,
      ...clientSortable('location'),
      defaultHidden: true,
      headerName: t('locationColumnTitle'),
      minWidth: 170,
      valueFormatter: (params) => params.value
        ? stringifyCoordinates({ latitude: params.value[1], longitude: params.value[0] }, coordinatesRepresentation)
        : '',
      valueGetter: (params) => calcPointCoordinates(params.data),
    },
    ...detailColumns,
  ], [clientSortable, coordinatesRepresentation, detailColumns, eventTypes, serverSortable, t, tPriorities, tStates]);

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
      dispatch(setFeedTableClientSort(TAB_KEYS.EVENTS, null));
      dispatch(updateEventFilter({ filter: { sort: [direction, option] } }));
    } else {
      // A cleared sort falls back to the feed's own.
      dispatch(setFeedTableClientSort(
        TAB_KEYS.EVENTS,
        sortedColumn ? { colId: sortedColumn.colId, feedSort: eventSort, sort: sortedColumn.sort } : null
      ));
    }
  };

  const onLoadMore = () => {
    const nextPageUrl = eventsFeed.events.next;
    if (nextPageUrl && loadingPageUrlRef.current !== nextPageUrl) {
      const releasePageUrl = () => {
        if (loadingPageUrlRef.current === nextPageUrl) {
          loadingPageUrlRef.current = null;
        }
      };

      loadingPageUrlRef.current = nextPageUrl;
      dispatch(fetchNextEventFeedPage(nextPageUrl)).then(releasePageUrl, releasePageUrl);
    }
  };

  // The same export as the menu's Field Events report: every event matching the feed filter, with its details.
  const onExport = () => downloadFileFromUrl(
    `${API_URL}activity/events/export?${calcEventFilterForRequest({}, eventSort)}`,
    {}
  );

  const onOpenRow = (event) => {
    navigate(getEventPath(event));

    const coordinates = event.is_collection ? getCoordinatesForCollection(event) : getCoordinatesForEvent(event);
    if (coordinates?.length) {
      jumpToLocation(coordinates);
    }
  };

  // The same rules as the event's own menu.
  const getLinkPermissions = (event) => selectEventLinkPermissions(store.getState(), event);

  const canUpdateEvent = (event) => selectEventCategoryPermissions(store.getState(), event).hasUpdatePermission;

  const updateSelectedEvents = async (selectedEvents, updateEvent, clearSelection) => {
    setIsUpdatingState(true);

    const results = await settleInBatches(selectedEvents, updateEvent);
    const failedCount = results.filter((result) => result.status === 'rejected').length;

    showToast(failedCount
      ? { message: t('bulkUpdateErrorMessage', { count: failedCount }) }
      : { message: t('bulkUpdateSuccessMessage', { count: selectedEvents.length }), toastConfig: { type: 'success' } });

    setIsUpdatingState(false);
    clearSelection();
    eventsFeed.loadFeedEvents(true);
  };

  const setSelectedEventsState = (selectedEvents, state, clearSelection) => {
    const updatableEvents = selectedEvents.filter(canUpdateEvent);
    const containedEvents = updatableEvents.flatMap(getContainedEvents);

    return updateSelectedEvents(
      uniqBy([...selectedEvents, ...containedEvents], 'id'),
      (event) => selectedEvents.includes(event) && !updatableEvents.includes(event)
        ? Promise.reject(new Error('The event cannot be updated'))
        : dispatch(setEventState(event.id, state)),
      clearSelection
    );
  };

  const addSelectedToPatrol = (selectedEvents, patrol, clearSelection) => updateSelectedEvents(
    selectedEvents,
    (event) => getLinkPermissions(event).canAddToPatrol
      ? dispatch(addEventToPatrol(event.id, patrol.id))
      : Promise.reject(new Error('The event cannot be added to this patrol')),
    clearSelection
  );

  const addSelectedToIncident = async (selectedEvents, existingIncident, clearSelection) => {
    const canJoinIncident = (event) => getLinkPermissions(event).canAddToIncident;

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

  const openLinkModal = (type, selectedEvents, clearSelection) => setLinkModal({
    canCreateIncident: selectedEvents.some((event) => getLinkPermissions(event).canCreateIncident),
    clearSelection,
    events: selectedEvents,
    show: true,
    type,
  });

  const closeLinkModal = () => setLinkModal((currentLinkModal) => ({ ...currentLinkModal, show: false }));

  const onAddToLinkTarget = async (target) => {
    closeLinkModal();

    await (linkModal.type === EVENT_LINK_TARGET_TYPES.PATROL
      ? addSelectedToPatrol(linkModal.events, target, linkModal.clearSelection)
      : addSelectedToIncident(linkModal.events, target, linkModal.clearSelection));
  };

  const onCreateIncident = async () => {
    closeLinkModal();

    await addSelectedToIncident(linkModal.events, null, linkModal.clearSelection);
  };

  const renderBulkActions = (selectedEvents, clearSelection) => {
    const canUpdate = selectedEvents.some(canUpdateEvent);
    const linkPermissions = selectedEvents.map(getLinkPermissions);

    return <>
      {canUpdate && <button
        className={styles.bulkActionButton}
        disabled={isUpdatingState}
        onClick={() => setSelectedEventsState(selectedEvents, EVENT_FORM_STATES.RESOLVED, clearSelection)}
        type="button"
      >
        {t('resolveButtonLabel')}
      </button>}

      {canUpdate && <button
        className={styles.bulkActionButton}
        disabled={isUpdatingState}
        onClick={() => setSelectedEventsState(selectedEvents, EVENT_FORM_STATES.ACTIVE, clearSelection)}
        type="button"
      >
        {t('reopenButtonLabel')}
      </button>}

      {linkPermissions.some((permissions) => permissions.canAddToPatrol) && <button
        className={styles.bulkActionButton}
        disabled={isUpdatingState}
        onClick={() => openLinkModal(EVENT_LINK_TARGET_TYPES.PATROL, selectedEvents, clearSelection)}
        type="button"
      >
        {tReportMenu('addToPatrolOption')}
      </button>}

      {linkPermissions.some((permissions) => permissions.canAddToIncident) && <button
        className={styles.bulkActionButton}
        disabled={isUpdatingState}
        onClick={() => openLinkModal(EVENT_LINK_TARGET_TYPES.INCIDENT, selectedEvents, clearSelection)}
        type="button"
      >
        {tReportMenu('addToIncidentOption')}
      </button>}
    </>;
  };

  return <>
    <FeedTable
      ariaLabel={tSideBar('eventsLink')}
      columnDefs={columnDefs}
      fullLoad={fullLoad}
      getRowClass={getRowClass}
      getRowId={(params) => params.data.id}
      getRowPath={getEventPath}
      layoutScope={eventTypeFilter.length === 1 ? eventTypeFilter[0] : undefined}
      loading={eventsFeed.loadingEventFeed}
      onExport={onExport}
      onLoadMore={clientSort ? undefined : onLoadMore}
      onOpenRow={onOpenRow}
      onSortChanged={onSortChanged}
      renderBulkActions={renderBulkActions}
      rowData={fullLoad.rows}
      tableKey={TAB_KEYS.EVENTS}
      toolbarContainer={toolbarContainer}
      totalCount={eventsFeed.events.count}
    />

    {/* The modal names the selection where it would name a single event. */}
    <DelayedUnmount isMounted={linkModal.show}>
      <LinkEventModal
        canCreateIncident={!!linkModal.canCreateIncident}
        event={{ title: t('selectedCountMessage', { count: linkModal.events.length }) }}
        isLinking={isUpdatingState}
        onAdd={onAddToLinkTarget}
        onCreateIncident={onCreateIncident}
        onHide={closeLinkModal}
        show={linkModal.show}
        type={linkModal.type}
      />
    </DelayedUnmount>
  </>;
};

export default EventsTable;
