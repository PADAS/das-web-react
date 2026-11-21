import { useCallback, useContext, useEffect, useRef } from 'react';
import axios from 'axios';
import { bbox, bboxPolygon, center } from '@turf/turf';
import { useLocation } from 'react-router';
import { useStore } from 'react-redux';
import uniq from 'lodash/uniq';

import {
  API_URL,
  BREAKPOINTS,
  EVENT_SORT_OPTIONS,
  EVENT_STATE_CHOICES,
  PREVIEW_FEATURES,
  SYSTEM_CONFIG_FLAGS,
  TAB_KEYS,
  VERTICAL_NAV_RAIL_WIDTH_PIXELS,
} from '../../constants';
import { ATLAS_APP_ACTIONS } from '../../utils/atlas-app-messages';
import { addPropsToGeoJsonByKey, calcSidebarPaddingLeft } from '../../utils/map';
import { fetchEvent } from '../../ducks/events';
import { fetchPatrol, updatePatrolTrackState } from '../../ducks/patrols';
import { fetchTracksIfNecessary } from '../../utils/tracks';
import {
  getCoordinatesForCollection,
  getCoordinatesForEvent,
  getEventIdsForCollection,
} from '../../utils/events';
import { getBoundsForPatrol, patrolStateAllowsTrackDisplay } from '../../utils/patrols';
import { getPreviewFeatureValue } from '../../utils/feature-flags';
import { getUniqueSubjectGroupSubjectIDs } from '../../utils/subjects';
import { hideSubjects, setMapLayersFilterText, showAnalyzers, showFeatures, showSubjects } from '../../ducks/map-layer-filter';
import {
  openMapFeatureType,
  pinSubjectTracks,
  setBounceEventIDs,
  setReportHeatmapVisibility,
  updateHeatmapSubjects,
} from '../../ducks/map-ui';
import { selectHydratedSubjectGroupsWithLastPositionTime } from '../../selectors/subjects';
import { selectOtusTabWidth } from '../../selectors/otus';
import { selectPatrolTrackData } from '../../selectors/patrols';
import { setMapFeatureHighlightIDs } from '../../ducks/mapFeatureHighlight';
import { setTimeSliderAt, sleep, waitUntil } from '../../utils/atlas-view';
import { setTrackLength, setTrackLengthOrigin, TRACK_LENGTH_ORIGINS } from '../../ducks/tracks';
import { setVirtualDate } from '../../ducks/timeslider';
import { showPopup } from '../../ducks/popup';
import { updateEventFilter } from '../../ducks/event-filter';
import { updatePatrolFilter } from '../../ducks/patrol-filter';
import { useMatchMedia } from '..';
import { usePatrolsPermissions } from '../usePermissions';
import useJumpToLocation, { MAP_CONTROLS_PADDING_PIXELS } from '../useJumpToLocation';
import useNavigate from '../useNavigate';

import { MapContext } from '../../MapContext';
import { NavigationContext } from '../../NavigationContextProvider';

export const ROUTE_CHANGE_TIMEOUT_MS = 1000;
export const TRACK_LOAD_TIMEOUT_MS = 5000;
export const BOUNCE_DELAY_MS = 100;
// Narrower than this, the subject is centred across the map, panel included.
const MIN_FRAMING_WIDTH_PIXELS = 150;
const SMALL_LAYOUT_RIGHT_PADDING_PIXELS = 12;
const SUBJECT_ZOOM = 14;
const PATROL_FIT_MAX_ZOOM = 17;
const DAY_MS = 86_400_000;
const HOUR_MS = 3_600_000;

const EVENT_STATES_BY_OPTION = {
  active: EVENT_STATE_CHOICES.find((choice) => choice.key === 'active').value,
  all: null,
  resolved: EVENT_STATE_CHOICES.find((choice) => choice.key === 'resolved').value,
  review: EVENT_STATE_CHOICES.find((choice) => choice.key === 'review').value,
};

const LAYERS_TAB_FLAGS = {
  analyzers: SYSTEM_CONFIG_FLAGS.ANALYZERS,
  features: SYSTEM_CONFIG_FLAGS.SPATIAL_FEATURES,
  subjects: SYSTEM_CONFIG_FLAGS.SUBJECTS,
};

const skip = (action, reason) => console.warn(`[otus:app] ${action}: skipped, ${reason}`);

const isEnabled = (state, flag) => !!state.view.systemConfig[flag];

const bboxToCorners = ([west, south, east, north]) => (west === east && south === north
  ? [west, south]
  : [[west, south], [east, north]]);

// Positions of a fetched track inside the window, most recent first.
const calcTrackCoordinatesInWindow = (trackData, since, until) => {
  const feature = trackData?.track?.features?.[0];
  if (!feature?.geometry) return [];

  const times = feature.properties?.coordinateProperties?.times ?? [];
  const sinceTime = since ? Date.parse(since) : -Infinity;
  const untilTime = until ? Date.parse(until) : Infinity;

  return feature.geometry.coordinates.filter((_, index) => {
    const time = times[index] ? Date.parse(times[index]) : null;

    return time === null || (time >= sinceTime && time <= untilTime);
  });
};

const calcLngLatBounds = (coordinates) => coordinates.reduce(
  ([[west, south], [east, north]], [lng, lat]) => [
    [Math.min(west, lng), Math.min(south, lat)],
    [Math.max(east, lng), Math.max(north, lat)],
  ],
  [[Infinity, Infinity], [-Infinity, -Infinity]]
);

const findSubjectPositionAt = (trackData, time) => {
  const feature = trackData?.track?.features?.[0];
  if (!feature?.geometry) return null;

  const times = feature.properties?.coordinateProperties?.times ?? [];
  const index = times.findIndex((value) => Date.parse(value) <= Date.parse(time));

  return index === -1 ? null : feature.geometry.coordinates[index];
};

// Without a history (as in tests of other parts), a move is just made.
const NO_CAMERA_HISTORY = { begin: () => null, move: async (_session, performMove) => performMove() };

const createActionRunner = ({ getLatest, store }) => {
  const { dispatch } = store;
  const getState = () => store.getState();

  const cameraHistory = () => getLatest().cameraHistory ?? NO_CAMERA_HISTORY;

  const navigateTo = async (action, path, navigationData) => {
    if (getLatest().isNavigationBlocked) {
      console.warn(`[otus:app] ${action}: not opening ${path}, the open record has unsaved edits`);

      return false;
    }

    getLatest().navigate(path, undefined, navigationData);

    // The jump padding depends on the route, so the jump waits for it.
    await waitUntil(() => getLatest().location.pathname === path, { timeoutMs: ROUTE_CHANGE_TIMEOUT_MS });

    return true;
  };

  const jumpTo = (...args) => getLatest().jumpToLocation(...args);

  // Centres a subject in the visible map, a third of the way up so its popup
  // has room above it.
  const calcFramingPadding = () => {
    const { isMediumLayoutOrLarger, location, map } = getLatest();
    const mapRect = map.getContainer().getBoundingClientRect();
    const left = calcSidebarPaddingLeft({
      isMediumLayoutOrLarger,
      otusTabWidth: selectOtusTabWidth(getState()),
      pathname: location.pathname,
    }) ?? (isMediumLayoutOrLarger ? VERTICAL_NAV_RAIL_WIDTH_PIXELS : 0);
    const right = isMediumLayoutOrLarger ? MAP_CONTROLS_PADDING_PIXELS : SMALL_LAYOUT_RIGHT_PADDING_PIXELS;

    return {
      bottom: 0,
      left: mapRect.width - left - right >= MIN_FRAMING_WIDTH_PIXELS ? left : 0,
      right,
      top: Math.round(mapRect.height / 3),
    };
  };

  const frameSubject = (coordinates, zoom = SUBJECT_ZOOM) => {
    const { map } = getLatest();
    if (!map) return;

    map.easeTo({ center: coordinates, padding: calcFramingPadding(), zoom });
  };

  // With the tracks from before the request, only newly fetched ones count.
  const waitForTracks = (ids, { every = true, previousTracks = null } = {}) => {
    const isLoaded = (id) => !!getState().data.tracks[id]
      && (!previousTracks || getState().data.tracks[id] !== previousTracks[id]);

    return waitUntil(
      () => every ? ids.every(isLoaded) : ids.some(isLoaded),
      { store, timeoutMs: TRACK_LOAD_TIMEOUT_MS }
    );
  };

  // An open-ended window (or one ending now) is the track length. One ending
  // in the past can only be drawn by the time slider, so it moves the event
  // filter's range, which the slider and the track envelope follow.
  const applyTrackWindow = async ({ since, until }) => {
    if (!since) return false;

    if (!until || Date.now() - Date.parse(until) <= HOUR_MS) {
      dispatch(setTrackLengthOrigin(TRACK_LENGTH_ORIGINS.CUSTOM_LENGTH));
      dispatch(setTrackLength(Math.max(1, Math.ceil((Date.now() - Date.parse(since)) / DAY_MS))));
    } else {
      await setTimeSliderAt(store, {
        dateRange: { lower: since, upper: until },
        origin: TRACK_LENGTH_ORIGINS.EVENT_FILTER,
        virtualDate: until,
      });
    }

    return true;
  };

  const fetchSubject = async (id) => {
    const storedSubject = getState().data.subjectStore[id];
    if (storedSubject?.last_position) return storedSubject;

    const response = await axios.get(`${API_URL}subject/${id}`);

    return response.data.data;
  };

  const openSubjectPopup = async (action, id, { fly = true } = {}) => {
    let subject;
    try {
      subject = await fetchSubject(id);
    } catch (error) {
      skip(action, `subject ${id} could not be loaded (${error?.response?.status ?? error?.message})`);

      return null;
    }

    const lastPosition = addPropsToGeoJsonByKey(subject, 'last_position').last_position;
    const feature = lastPosition?.type === 'FeatureCollection' ? lastPosition.features?.[0] : lastPosition;
    if (!feature?.geometry) {
      skip(action, `subject ${id} has no known position`);

      return null;
    }

    dispatch(showSubjects(id));
    const cameraSession = fly ? cameraHistory().begin() : null;
    const moved = fly ? cameraHistory().move(cameraSession, () => frameSubject(feature.geometry.coordinates)) : null;
    dispatch(showPopup('subject', {
      coordinates: feature.geometry.coordinates,
      geometry: feature.geometry,
      properties: feature.properties,
    }));
    await moved;

    return subject;
  };

  const jumpToTracks = async (action, ids, { frameSingleSubject = false, since, until }) => {
    const { tracks } = getState().data;
    const coordinates = ids.flatMap((id) => calcTrackCoordinatesInWindow(tracks[id], since, until));

    if (!coordinates.length) {
      console.warn(`[otus:app] ${action}: no track positions in the window to fit the map to`);

      return;
    }

    const cameraSession = cameraHistory().begin();

    if (frameSingleSubject && ids.length === 1 && getLatest().map) {
      // One subject is framed at its latest position in the window, zoomed out
      // a step past its track's fit, as the fit is centred elsewhere.
      const { map } = getLatest();
      const camera = coordinates.length > 1
        ? map.cameraForBounds?.(calcLngLatBounds(coordinates), { padding: { ...calcFramingPadding(), bottom: 12, top: 12 } })
        : null;
      const zoom = camera ? Math.min(SUBJECT_ZOOM, camera.zoom - 1) : SUBJECT_ZOOM;

      await cameraHistory().move(cameraSession, () => frameSubject(coordinates[0], zoom));
    } else {
      await cameraHistory().move(cameraSession, () => jumpTo(coordinates));
    }
  };

  const handlers = {
    [ATLAS_APP_ACTIONS.EVENTS_FILTER]: async (params) => {
      const state = getState();
      if (!isEnabled(state, SYSTEM_CONFIG_FLAGS.EVENTS)) return skip(params.action, 'events are disabled');

      const { date_range: currentDateRange } = state.data.eventFilter.filter;
      const filter = {};
      if (params.since !== undefined || params.until !== undefined) {
        filter.date_range = {
          lower: params.since ?? currentDateRange.lower,
          upper: params.until !== undefined ? params.until : currentDateRange.upper,
        };
      }
      if (params.event_types) filter.event_type = params.event_types;
      if (params.priority) filter.priority = params.priority;
      if (params.reported_by) filter.reported_by = params.reported_by;
      if (params.text !== undefined) filter.text = params.text;
      if (params.sort) {
        filter.sort = [params.sort.dir, EVENT_SORT_OPTIONS.find((option) => option.value === params.sort.field)];
      }

      dispatch(updateEventFilter({
        filter,
        ...(params.state && { state: EVENT_STATES_BY_OPTION[params.state] }),
      }));

      // Unlike the other filters, this one opens its feed unless told not to.
      if (params.open !== false) await navigateTo(params.action, `/${TAB_KEYS.EVENTS}`);
    },

    [ATLAS_APP_ACTIONS.PATROLS_FILTER]: async (params) => {
      const state = getState();
      if (!isEnabled(state, SYSTEM_CONFIG_FLAGS.PATROL_MANAGEMENT) || !getLatest().canReadPatrols) {
        return skip(params.action, 'patrols are disabled or not readable by this user');
      }

      const { date_range: currentDateRange } = state.data.patrolFilter.filter;
      const filter = {};
      if (params.since !== undefined || params.until !== undefined) {
        // An open-ended range is requested up to the end of today, as the app does.
        filter.date_range = {
          lower: params.since ?? currentDateRange.lower,
          upper: params.until !== undefined ? params.until : currentDateRange.upper,
        };
      }
      if (params.patrol_types) filter.patrol_type = params.patrol_types;
      if (params.leaders) filter.tracked_by = params.leaders;
      if (params.text !== undefined) filter.text = params.text;

      dispatch(updatePatrolFilter({ filter, ...(params.status && { status: params.status }) }));

      if (params.open) await navigateTo(params.action, `/${TAB_KEYS.PATROLS}`);
    },

    [ATLAS_APP_ACTIONS.OPEN_EVENT]: async ({ action, id }) => {
      if (!isEnabled(getState(), SYSTEM_CONFIG_FLAGS.EVENTS)) return skip(action, 'events are disabled');

      // The camera entry is written before leaving, and the move joins the new route's entry.
      const cameraSession = cameraHistory().begin();
      await navigateTo(action, `/${TAB_KEYS.EVENTS}/${id}`);

      let event = getState().data.eventStore[id];
      if (!event?.geojson && !event?.contains) {
        try {
          event = (await dispatch(fetchEvent(id))).data.data;
        } catch (error) {
          return skip(action, `event ${id} could not be loaded (${error?.response?.status ?? error?.message})`);
        }
      }

      const coordinates = event.is_collection ? getCoordinatesForCollection(event) : getCoordinatesForEvent(event);
      if (coordinates?.length) {
        await cameraHistory().move(cameraSession, () => jumpTo(coordinates));
      } else {
        console.warn(`[otus:app] ${action}: event ${id} has no location to fly to`);
      }

      // Only the non-tile events layer can bounce a marker.
      if (!getPreviewFeatureValue(getState(), PREVIEW_FEATURES.EVENTS_VECTOR_TILES)) {
        dispatch(setBounceEventIDs([]));
        await sleep(BOUNCE_DELAY_MS);
        dispatch(setBounceEventIDs(event.is_collection ? getEventIdsForCollection(event) ?? [] : [id]));
      }
    },

    [ATLAS_APP_ACTIONS.OPEN_PATROL]: async ({ action, id }) => {
      if (!isEnabled(getState(), SYSTEM_CONFIG_FLAGS.PATROL_MANAGEMENT) || !getLatest().canReadPatrols) {
        return skip(action, 'patrols are disabled or not readable by this user');
      }

      try {
        await dispatch(fetchPatrol(id));
      } catch (error) {
        return skip(action, `patrol ${id} could not be loaded (${error?.response?.status ?? error?.message})`);
      }

      const { pinned, visible } = getState().view.patrolTrackState;
      dispatch(updatePatrolTrackState({ pinned: uniq([id, ...pinned]), visible: visible.filter((item) => item !== id) }));

      const cameraSession = cameraHistory().begin();
      await navigateTo(action, `/${TAB_KEYS.PATROLS}/${id}`);

      const patrol = getState().data.patrolStore[id];
      if (patrolStateAllowsTrackDisplay(patrol)) {
        await waitUntil(
          () => !!selectPatrolTrackData(getState(), getState().data.patrolStore[id]).trackData?.track,
          { store, timeoutMs: TRACK_LOAD_TIMEOUT_MS }
        );
      }

      const latestPatrol = getState().data.patrolStore[id];
      const bounds = getBoundsForPatrol(latestPatrol, selectPatrolTrackData(getState(), latestPatrol));
      if (bounds) {
        await cameraHistory().move(
          cameraSession,
          () => jumpTo(bboxToCorners(bounds), undefined, { maxZoom: PATROL_FIT_MAX_ZOOM })
        );
      } else {
        console.warn(`[otus:app] ${action}: patrol ${id} has no positions to fit the map to`);
      }
    },

    [ATLAS_APP_ACTIONS.SUBJECT_POPUP]: async ({ action, id, track }) => {
      if (!isEnabled(getState(), SYSTEM_CONFIG_FLAGS.SUBJECTS)) return skip(action, 'subjects are disabled');

      const subject = await openSubjectPopup(action, id);
      if (!subject || !track) return;

      if (subject.tracks_available) {
        dispatch(pinSubjectTracks(id));
      } else {
        console.warn(`[otus:app] ${action}: subject ${id} has no track available`);
      }
    },

    [ATLAS_APP_ACTIONS.SUBJECT_TRACK]: async ({ action, ids, since, until }) => {
      if (!isEnabled(getState(), SYSTEM_CONFIG_FLAGS.SUBJECTS)) return skip(action, 'subjects are disabled');

      const previousTracks = getState().data.tracks;
      const isWindowChanged = await applyTrackWindow({ since, until });
      dispatch(showSubjects(...ids));
      dispatch(pinSubjectTracks(...ids));

      await waitForTracks(ids, { previousTracks: isWindowChanged ? previousTracks : null });
      await jumpToTracks(action, ids, { frameSingleSubject: true, since, until });
    },

    [ATLAS_APP_ACTIONS.SUBJECT_AT_TIME]: async ({ action, id, time }) => {
      if (!isEnabled(getState(), SYSTEM_CONFIG_FLAGS.SUBJECTS)) return skip(action, 'subjects are disabled');

      // The map moves an open subject popup to the slider's position, so the
      // popup opens first.
      const subject = await openSubjectPopup(action, id, { fly: false });
      if (!subject) return;

      const now = Date.now();
      const momentTime = Math.min(Date.parse(time), now);
      const moment = new Date(momentTime).toISOString();

      await setTimeSliderAt(store, {
        dateRange: {
          lower: new Date(momentTime - DAY_MS).toISOString(),
          upper: new Date(Math.min(now, momentTime + DAY_MS)).toISOString(),
        },
        virtualDate: moment,
      });

      const previousTracks = getState().data.tracks;
      if (subject.tracks_available) fetchTracksIfNecessary([id]);
      const isTrackLoaded = await waitForTracks([id], { previousTracks });

      // Re-fired once the track is in, so the popup lands on its position.
      dispatch(setVirtualDate(new Date(momentTime - 1).toISOString()));
      dispatch(setVirtualDate(moment));

      const position = isTrackLoaded ? findSubjectPositionAt(getState().data.tracks[id], moment) : null;
      if (position) {
        await cameraHistory().move(cameraHistory().begin(), () => frameSubject(position));
      } else {
        console.warn(`[otus:app] ${action}: subject ${id} has no position at or before ${moment}`);
      }
    },

    [ATLAS_APP_ACTIONS.SUBJECT_HEATMAP]: async ({ action, ids, since, until }) => {
      if (!isEnabled(getState(), SYSTEM_CONFIG_FLAGS.SUBJECTS)) return skip(action, 'subjects are disabled');

      const previousTracks = getState().data.tracks;
      const isWindowChanged = await applyTrackWindow({ since, until });
      // The map turns the report heatmap off while a subject heatmap is on.
      dispatch(setReportHeatmapVisibility(false));
      dispatch(updateHeatmapSubjects(ids));

      await waitForTracks(ids, { every: false, previousTracks: isWindowChanged ? previousTracks : null });
      await jumpToTracks(action, ids, { since, until });
    },

    [ATLAS_APP_ACTIONS.REPORT_HEATMAP]: ({ action, on }) => {
      if (!isEnabled(getState(), SYSTEM_CONFIG_FLAGS.EVENTS)) return skip(action, 'events are disabled');

      if (on) dispatch(updateHeatmapSubjects([]));
      dispatch(setReportHeatmapVisibility(on));
    },

    [ATLAS_APP_ACTIONS.SUBJECTS_VISIBILITY]: ({ action, hide, only, show }) => {
      if (!isEnabled(getState(), SYSTEM_CONFIG_FLAGS.SUBJECTS)) return skip(action, 'subjects are disabled');

      if (hide) {
        dispatch(hideSubjects(...hide));
      } else if (show) {
        dispatch(showSubjects(...show));
      } else {
        const allSubjectIds = getUniqueSubjectGroupSubjectIDs(...selectHydratedSubjectGroupsWithLastPositionTime(getState()));
        const idsToHide = allSubjectIds.filter((id) => !only.includes(id));

        dispatch(showSubjects(...only));
        if (idsToHide.length) dispatch(hideSubjects(...idsToHide));
      }
    },

    [ATLAS_APP_ACTIONS.SHOW_FEATURE]: async ({ action, id }) => {
      const state = getState();
      if (!isEnabled(state, SYSTEM_CONFIG_FLAGS.SPATIAL_FEATURES)) return skip(action, 'spatial features are disabled');

      const featureType = state.data.featureSets.data
        .flatMap((featureSet) => featureSet.types ?? [])
        .find((type) => (type.feature_summaries ?? []).some((summary) => summary.id === id));
      const summary = featureType?.feature_summaries.find((item) => item.id === id);
      if (!summary) return skip(action, `feature ${id} is not listed in Map Layers`);

      dispatch(showFeatures(id));
      dispatch(openMapFeatureType(featureType.name));

      if (!summary.bounds) {
        return console.warn(`[otus:app] ${action}: feature ${id} is shown, but its extent is unknown`);
      }

      const moved = cameraHistory().move(cameraHistory().begin(), () => jumpTo(bboxToCorners(summary.bounds)));
      dispatch(setMapFeatureHighlightIDs([id]));

      const centerPoint = center(bboxPolygon(summary.bounds), { properties: { id, name: summary.name } });
      dispatch(showPopup('feature-symbol', { ...centerPoint, coordinates: centerPoint.geometry.coordinates }));
      await moved;
    },

    [ATLAS_APP_ACTIONS.SHOW_ANALYZER]: async ({ action, id }) => {
      const state = getState();
      if (!isEnabled(state, SYSTEM_CONFIG_FLAGS.ANALYZERS)) return skip(action, 'analyzers are disabled');

      const analyzer = state.data.analyzerFeatures.data.find((item) => item.id === id);
      if (!analyzer) return skip(action, `analyzer ${id} is not active`);

      dispatch(showAnalyzers(id));

      if (analyzer.geojson?.features?.length) {
        await cameraHistory().move(cameraHistory().begin(), () => jumpTo(bboxToCorners(bbox(analyzer.geojson))));
      }
    },

    [ATLAS_APP_ACTIONS.LAYERS_SEARCH]: async ({ action, tab, text }) => {
      const state = getState();
      const isLayersTabShown = Object.values(LAYERS_TAB_FLAGS).some((flag) => isEnabled(state, flag))
        || isEnabled(state, SYSTEM_CONFIG_FLAGS.EVENTS);
      if (!isLayersTabShown) return skip(action, 'the Map Layers tab is disabled');

      dispatch(setMapLayersFilterText(text));

      if (tab) {
        if (!isEnabled(state, LAYERS_TAB_FLAGS[tab])) return skip(action, `the ${tab} tab is disabled`);

        await navigateTo(action, `/${TAB_KEYS.LAYERS}`, { mapLayersTab: tab });
      }
    },
  };

  return (message) => handlers[message.action]?.(message);
};

// Exported for tests: applies one validated message.
export const runAtlasAppAction = (message, context) => createActionRunner(context)(message);

// Applies validated otus:app messages with the app's own action creators and
// hooks. The caller runs them one at a time, in the order they arrive, and
// shares its camera history with them.
const useAtlasAppActions = (cameraHistory) => {
  const isMediumLayoutOrLarger = useMatchMedia(BREAKPOINTS.screenIsMediumLayoutOrLarger);
  const jumpToLocation = useJumpToLocation();
  const location = useLocation();
  const map = useContext(MapContext);
  const navigate = useNavigate();
  const { hasPatrolsReadPermission } = usePatrolsPermissions();
  const { isNavigationBlocked } = useContext(NavigationContext);

  const store = useStore();

  // Actions await routes and data, so they read the values of the latest render.
  const latestRef = useRef({});
  useEffect(() => {
    latestRef.current = {
      cameraHistory,
      canReadPatrols: hasPatrolsReadPermission,
      isMediumLayoutOrLarger,
      isNavigationBlocked,
      jumpToLocation,
      location,
      map,
      navigate,
    };
  });

  return useCallback(
    (message) => runAtlasAppAction(message, { getLatest: () => latestRef.current, store }),
    [store]
  );
};

export default useAtlasAppActions;
