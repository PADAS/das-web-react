import axios, { CancelToken } from 'axios';
import { featureCollection } from '@turf/turf';
import merge from 'lodash/merge';

import { API_URL, REALTIME_OVERLAY_WINDOW_MS } from '../constants';
import globallyResettableReducer from '../reducers/global-resettable';
import { addPropsToGeoJsonByKey } from '../utils/map';
import { fixAntimeridianCrossing } from '../utils/tracks';
import { TRACKS_API_URL } from './tracks';

const CLEAR_SUBJECT_DATA = 'CLEAR_SUBJECT_DATA';

const SUBJECTS_API_URL = `${API_URL}subjects`;

const INITIAL_STATE = {
  subjects: featureCollection([]),
  segments: featureCollection([]),
};

// Actions
export const SET_REALTIME_OVERLAY = 'SET_REALTIME_OVERLAY';
export const UPDATE_OVERLAY_SUBJECT_FROM_SOCKET = 'UPDATE_OVERLAY_SUBJECT_FROM_SOCKET';
export const APPEND_OVERLAY_SEGMENT_FROM_SOCKET = 'APPEND_OVERLAY_SEGMENT_FROM_SOCKET';

// Action creators
export const setRealtimeOverlay = (subjects, segments) => ({
  type: SET_REALTIME_OVERLAY,
  payload: { subjects, segments },
});

export const updateOverlaySubjectFromSocket = (feature) => ({
  type: UPDATE_OVERLAY_SUBJECT_FROM_SOCKET,
  payload: feature,
});

export const appendOverlaySegmentFromSocket = (segmentFeature, cutoff) => ({
  type: APPEND_OVERLAY_SEGMENT_FROM_SOCKET,
  payload: { segment: segmentFeature, cutoff },
});

/**
 * Update overlay from a subject_status socket payload: update subject point and append
 * a segment from previous position to new position. Call before SOCKET_SUBJECT_STATUS
 * so previous position is still in subjectStore/overlay.
 */
export const updateOverlayFromSubjectStatus = (payload) => (dispatch, getState) => {
  if (!payload?.geometry?.coordinates || !payload?.properties?.id) return;
  const id = payload.properties.id;
  const newCoords = payload.geometry.coordinates;
  const state = getState();
  const subjectStore = state.data?.subjectStore || {};
  const overlay = state.data?.realtimeOverlay || {};
  const subject = subjectStore[id];

  const pointFeature = {
    type: 'Feature',
    geometry: payload.geometry,
    properties: {
      ...(subject?.last_position?.properties || {}),
      ...payload.properties,
      id,
      image: payload.properties?.image ?? subject?.last_position?.properties?.image ?? subject?.image_url,
    },
  };
  dispatch(updateOverlaySubjectFromSocket(pointFeature));

  let prevCoords = null;
  const overlaySubjects = overlay.subjects;
  if (overlaySubjects?.features) {
    const prev = overlaySubjects.features.find((f) => f.properties?.id === id);
    if (prev?.geometry?.coordinates) {
      prevCoords = prev.geometry.coordinates;
    }
  }
  if (!prevCoords && subject?.last_position?.geometry?.coordinates) {
    prevCoords = subject.last_position.geometry.coordinates;
  }
  if (prevCoords && (prevCoords[0] !== newCoords[0] || prevCoords[1] !== newCoords[1])) {
    const stroke = subject?.last_position?.properties?.stroke || subject?.stroke;
    const strokeWidth = subject?.last_position?.properties?.['stroke-width'] ?? subject?.['stroke-width'] ?? 1;
    const segmentFeature = {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: [prevCoords, newCoords],
      },
      properties: {
        subject_id: id,
        stroke: stroke || undefined,
        'stroke-width': strokeWidth,
        stroke_opacity: subject?.last_position?.properties?.['stroke-opacity'] ?? 0.8,
        start_time: payload.properties?.coordinateProperties?.time,
      },
    };
    const cutoff = new Date(Date.now() - REALTIME_OVERLAY_WINDOW_MS).toISOString();
    dispatch(appendOverlaySegmentFromSocket(segmentFeature, cutoff));
  }
};

/**
 * Fetch last REALTIME_OVERLAY_WINDOW_MS of subjects and tracks as GeoJSON for the overlay.
 * No bbox filter so results are stable across map moves.
 * Does not replace map subjects; only updates realtimeOverlay state.
 */
export const fetchRealtimeOverlay = (cancelToken = CancelToken.source()) => async (dispatch, getState) => {
  try {
    const updatedSince = new Date(Date.now() - REALTIME_OVERLAY_WINDOW_MS).toISOString();

    const subjectsResponse = await axios.get(SUBJECTS_API_URL, {
      cancelToken: cancelToken.token,
      params: { updated_since: updatedSince, use_lkl: true, include_inactive: false },
    });
    const subjectsData = subjectsResponse?.data?.data || [];

    const subjectIds = subjectsData.map((s) => s.id).filter(Boolean);
    if (subjectIds.length === 0) {
      dispatch(setRealtimeOverlay(featureCollection([]), featureCollection([])));
      return;
    }

    const subjectFeatures = [];
    subjectsData.forEach((subject) => {
      if (!subject.last_position) return;
      const enriched = addPropsToGeoJsonByKey(subject, 'last_position');
      const lp = enriched.last_position;
      if (lp.type === 'FeatureCollection' && lp.features) {
        subjectFeatures.push(...lp.features);
      } else if (lp.geometry) {
        subjectFeatures.push(lp);
      }
    });

    const segmentFeatures = [];
    try {
      const trackResponses = await Promise.all(
        subjectIds.map((id) => axios.get(TRACKS_API_URL(id), {
          params: { since: updatedSince },
          cancelToken: cancelToken.token,
        }))
      );
      const subjectStore = getState().data.subjectStore || {};
      const freshSubjectById = {};
      subjectsData.forEach((s) => { if (s.id) freshSubjectById[s.id] = s; });
      trackResponses.forEach((response, index) => {
        const subjectId = subjectIds[index];
        const trackFc = fixAntimeridianCrossing(response?.data?.data);
        if (!trackFc?.features?.length) return;
        const trackFeature = trackFc.features[0];
        const subject = subjectStore[subjectId];
        const fresh = freshSubjectById[subjectId];
        const stroke = fresh?.last_position?.properties?.stroke
          || subject?.last_position?.properties?.stroke
          || subject?.stroke;
        const strokeWidth = fresh?.last_position?.properties?.['stroke-width']
          ?? subject?.last_position?.properties?.['stroke-width']
          ?? subject?.['stroke-width']
          ?? 1;
        segmentFeatures.push({
          type: 'Feature',
          geometry: trackFeature.geometry,
          properties: {
            subject_id: subjectId,
            stroke: stroke || undefined,
            'stroke-width': strokeWidth,
            stroke_opacity: fresh?.last_position?.properties?.['stroke-opacity']
              ?? subject?.last_position?.properties?.['stroke-opacity']
              ?? 0.8,
            start_time: trackFeature.properties?.coordinateProperties?.times?.[0],
          },
        });
      });
    } catch (e) {
      if (!axios.isCancel(e)) {
        console.warn('realtime overlay: error fetching tracks', e);
      }
    }

    dispatch(setRealtimeOverlay(featureCollection(subjectFeatures), featureCollection(segmentFeatures)));
  } catch (e) {
    if (!axios.isCancel(e)) {
      console.warn('realtime overlay: error fetching', e);
    }
  }
};

// Reducer
function realtimeOverlayReducer(state = INITIAL_STATE, action = {}) {
  const { type, payload } = action;

  if (type === CLEAR_SUBJECT_DATA) {
    return INITIAL_STATE;
  }

  if (type === SET_REALTIME_OVERLAY) {
    const { subjects, segments } = payload;
    return {
      subjects: subjects && subjects.type === 'FeatureCollection' ? subjects : featureCollection(subjects || []),
      segments: segments && segments.type === 'FeatureCollection' ? segments : featureCollection(segments || []),
    };
  }

  if (type === UPDATE_OVERLAY_SUBJECT_FROM_SOCKET) {
    const feature = payload;
    const id = feature?.properties?.id;
    if (!id) return state;

    const subjects = { ...state.subjects };
    const features = [...(subjects.features || [])];
    const idx = features.findIndex((f) => f.properties?.id === id);
    const next = {
      type: 'Feature',
      geometry: feature.geometry,
      properties: merge({}, (features[idx] || {}).properties, feature.properties),
    };
    if (idx >= 0) {
      features[idx] = next;
    } else {
      features.push(next);
    }
    return {
      ...state,
      subjects: featureCollection(features),
    };
  }

  if (type === APPEND_OVERLAY_SEGMENT_FROM_SOCKET) {
    const { segment: segmentFeature, cutoff } = payload;
    if (!segmentFeature?.geometry?.coordinates?.length) return state;

    // Discard segments (existing or incoming) with no start_time or outside
    // the overlay window to prevent unbounded growth from malformed payloads.
    // Cutoff is computed by the dispatching thunk so this reducer stays pure.
    // Compare numerically so timezone-offset timestamps are handled correctly.
    const cutoffMs = Date.parse(cutoff);
    const isWithinWindow = (f) => {
      const startMs = Date.parse(f.properties?.start_time);
      return !Number.isNaN(startMs) && startMs >= cutoffMs;
    };
    if (!isWithinWindow(segmentFeature)) return state;

    const features = [
      ...(state.segments.features || []).filter(isWithinWindow),
      segmentFeature,
    ];
    return {
      ...state,
      segments: featureCollection(features),
    };
  }

  return state;
}

export default globallyResettableReducer(realtimeOverlayReducer, INITIAL_STATE);
