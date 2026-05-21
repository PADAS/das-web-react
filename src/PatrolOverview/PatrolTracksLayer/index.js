import { memo, useContext, useEffect, useRef, useState } from 'react';
import { Marker } from 'mapbox-gl';

import { MapContext } from '../../App';
import { colorForEntity, getPatrolTracks, subscribePatrolTracks } from '../patrolTracksStore';
import { getLegs, subscribeLegs } from '../legsStore';
import { getPatrolStateEntry, subscribePatrolState } from '../patrolStateStore';
import { isEntityVisible, subscribeVisibility } from '../trackVisibilityStore';
import { getDemoEvents } from '../../PatrolList/demoPatrols';

// Renders prototype patrol tracks on the main Mapbox map.
// Styling mirrors real subject tracks:
//   • Line layer per entity (rounded, opaque)
//   • Direction arrows along each line (symbol layer on the line source)
//   • Colored circle + name label at the last (current) position per entity
//   • Colored circles for any demo events associated with this patrol

const ARROW_IMAGE_ID = 'er-proto-track-arrow';

const sourceIdFor = (patrolId, name) => `er-proto-track-src-${patrolId}-${name}`;
const lineLayerIdFor = (patrolId, name) => `er-proto-track-line-${patrolId}-${name}`;
const arrowLayerIdFor = (patrolId, name) => `er-proto-track-arrows-${patrolId}-${name}`;
const SAFE_ID = (s) => s.replace(/[^a-zA-Z0-9_-]/g, '_');

const buildLineFeature = (points) => ({
  type: 'Feature',
  geometry: { type: 'LineString', coordinates: points.map((p) => [p.lng, p.lat]) },
  properties: {},
});

// Create a simple upward-pointing arrow imageData for Mapbox.
// symbol-placement:'line' auto-rotates it along the track direction.
const ensureArrowImage = (map) => {
  if (map.hasImage(ARROW_IMAGE_ID)) return;
  const size = 22;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  // Chevron arrow pointing up (north = 0°). Mapbox rotates it along the line.
  ctx.fillStyle = 'rgba(0, 86, 199, 0.88)';
  ctx.beginPath();
  ctx.moveTo(size / 2, 1);           // tip
  ctx.lineTo(size - 2, size - 2);    // bottom-right
  ctx.lineTo(size / 2, size - 7);    // inner notch
  ctx.lineTo(2, size - 2);           // bottom-left
  ctx.closePath();
  ctx.fill();
  map.addImage(ARROW_IMAGE_ID, ctx.getImageData(0, 0, size, size));
};

// Union.svg path — inline so we don't need a network fetch.
const UNION_PATH = 'M1.5 0C2.32843 3.54354e-08 3 0.671573 3 1.5V3H42C43.1046 3 44 3.89543 44 5V23C44 24.1046 43.1046 25 42 25H3V45.5C3 46.3284 2.32843 47 1.5 47C0.671574 47 0 46.3284 0 45.5V1.5C3.54354e-08 0.671573 0.671573 0 1.5 0Z';

// Create the flag element (Union.svg shape + label inside the flag area).
const createFlagEl = (label) => {
  const wrap = document.createElement('div');
  wrap.style.cssText = 'position:relative;width:44px;height:47px;pointer-events:none;';
  wrap.innerHTML = `
    <svg width="44" height="47" viewBox="0 0 44 47" fill="none" xmlns="http://www.w3.org/2000/svg" style="position:absolute;inset:0;">
      <path d="${UNION_PATH}" fill="black" fill-opacity="0.6"/>
    </svg>
    <span style="
      position:absolute;
      left:4px;top:5px;
      width:38px;height:18px;
      display:flex;align-items:center;justify-content:center;
      color:white;font-size:9.5px;font-weight:700;
      font-family:'Open Sans Semibold','Open Sans',sans-serif;
      line-height:1;white-space:nowrap;letter-spacing:0.2px;
    ">${label}</span>
  `;
  return wrap;
};

// Create a plain text label pill for Patrol Start / Patrol End.
const createTextLabelEl = (label) => {
  const el = document.createElement('div');
  el.style.cssText = `
    pointer-events:none;
    background:rgba(0,0,0,0.6);
    color:white;
    padding:3px 8px;
    border-radius:3px;
    font-size:11px;font-weight:700;
    font-family:'Open Sans Semibold','Open Sans',sans-serif;
    white-space:nowrap;
    box-shadow:0 1px 4px rgba(0,0,0,0.25);
  `;
  el.textContent = label;
  return el;
};

// Create a circular event-marker element styled after EarthRanger's event pins.
// Uses the app's existing sprite sheet for the event-type icon so icons appear
// automatically when the event type is registered in the system.
const createEventMarkerEl = (event) => {
  const color = event.color || '#5E6164';
  const wrap = document.createElement('div');
  wrap.title = event.title || '';
  wrap.style.cssText = `
    width:32px;height:32px;border-radius:50%;
    background:${color};
    border:2.5px solid white;
    box-shadow:0 2px 8px rgba(0,0,0,0.4);
    display:flex;align-items:center;justify-content:center;
    cursor:pointer;
    position:relative;
  `;
  // Try to render the event-type icon from the app's SVG sprite sheet.
  // Falls back gracefully (renders nothing inside the circle) if the icon id
  // is not present in the sprite.
  const iconId = event.event_type || 'generic_rep';
  wrap.innerHTML = `
    <svg width="17" height="17" style="fill:white;overflow:visible;" aria-hidden="true">
      <use href="#das--activity--static--sprite-src--${iconId}" />
    </svg>
  `;
  return wrap;
};

// Find the track point (across all entities) whose timestamp is closest to targetMs.
const nearestPoint = (tracks, targetMs) => {
  let best = null;
  let bestDiff = Infinity;
  Object.values(tracks).forEach((pts) => {
    if (!pts?.length) return;
    pts.forEach((p) => {
      if (!p.time) return;
      const diff = Math.abs(new Date(p.time).getTime() - targetMs);
      if (diff < bestDiff) { bestDiff = diff; best = p; }
    });
  });
  return best;
};

// Earliest/latest point across all entities.
const firstPoint = (tracks) => {
  let best = null;
  let bestMs = Infinity;
  Object.values(tracks).forEach((pts) => {
    if (!pts?.length) return;
    const t = new Date(pts[0].time).getTime();
    if (t < bestMs) { bestMs = t; best = pts[0]; }
  });
  return best;
};
const lastPoint = (tracks) => {
  let best = null;
  let bestMs = -Infinity;
  Object.values(tracks).forEach((pts) => {
    if (!pts?.length) return;
    const last = pts[pts.length - 1];
    const t = new Date(last.time).getTime();
    if (t > bestMs) { bestMs = t; best = last; }
  });
  return best;
};

const PatrolTracksLayer = ({ patrolId }) => {
  const map = useContext(MapContext);
  const [tick, setTick] = useState(0);
  const [legsVersion, setLegsVersion] = useState(0);
  const [stateVersion, setStateVersion] = useState(0);

  // Track which patrol IDs we've already flown to so switching patrols always
  // triggers a fresh camera move, regardless of component lifecycle.
  const flownToRef = useRef(new Set());

  // Refs so the visibility handler always sees the latest map/patrolId without
  // needing to be recreated on every render.
  const mapRef = useRef(map);
  const patrolIdRef = useRef(patrolId);
  useEffect(() => { mapRef.current = map; patrolIdRef.current = patrolId; });

  // Re-render whenever the tracks, legs, or patrol state stores change.
  useEffect(() => subscribePatrolTracks(() => setTick((v) => v + 1)), []);
  useEffect(() => subscribeLegs(() => setLegsVersion((v) => v + 1)), []);
  useEffect(() => subscribePatrolState(() => setStateVersion((v) => v + 1)), []);

  // Apply visibility changes to existing layers without recreating them.
  // Called whenever the trackVisibilityStore emits a change.
  useEffect(() => {
    const applyVisibility = () => {
      const m = mapRef.current;
      const pid = patrolIdRef.current;
      if (!m || !pid) return;
      const tracks = getPatrolTracks(pid);
      Object.keys(tracks).forEach((name) => {
        const safe = SAFE_ID(name);
        const layerVis = isEntityVisible(pid, name) ? 'visible' : 'none';
        try {
          const lineId = lineLayerIdFor(pid, safe);
          if (m.getLayer(lineId)) m.setLayoutProperty(lineId, 'visibility', layerVis);
          const arrowId = arrowLayerIdFor(pid, safe);
          if (m.getLayer(arrowId)) m.setLayoutProperty(arrowId, 'visibility', layerVis);
        } catch (_e) { /* layer not yet added */ }
      });
      // Refresh entity icon source so hidden entities disappear from the map.
      const iconSrcId = `er-proto-entity-icons-${pid}`;
      const iconSrc = m.getSource ? m.getSource(iconSrcId) : null;
      if (iconSrc) {
        const features = Object.entries(tracks)
          .filter(([name, pts]) => pts?.length >= 1 && isEntityVisible(pid, name))
          .map(([name, pts]) => {
            const last = pts[pts.length - 1];
            return {
              type: 'Feature',
              geometry: { type: 'Point', coordinates: [last.lng, last.lat] },
              properties: { name, color: colorForEntity(name) },
            };
          });
        try {
          iconSrc.setData({ type: 'FeatureCollection', features });
        } catch (_e) { /* ignore */ }
      }
    };
    return subscribeVisibility(applyVisibility);
  }, []); // intentionally empty — uses refs

  // Place flag markers at each leg start, and text labels at patrol start/end.
  // Re-runs when tracks, legs, or patrol state change.
  useEffect(() => {
    if (!map) return undefined;
    const markers = [];

    const addMarkers = () => {
      // Remove any previous markers before rebuilding.
      markers.forEach((m) => m.remove());
      markers.length = 0;

      const tracks = getPatrolTracks(patrolId);
      if (!Object.keys(tracks).length) return;

      const legs = getLegs(patrolId);
      const { state } = getPatrolStateEntry(patrolId);
      const isTerminal = state === 'Done' || state === 'Cancelled';

      // --- Patrol Start label ---
      const start = firstPoint(tracks);
      if (start) {
        markers.push(
          new Marker({ element: createTextLabelEl('Patrol Start'), anchor: 'bottom-left', offset: [8, -4] })
            .setLngLat([start.lng, start.lat])
            .addTo(map)
        );
      }

      // --- Leg flag markers ---
      legs.forEach((leg, i) => {
        const legMs = leg.startedAt ? new Date(leg.startedAt).getTime() : null;
        if (!legMs) return;
        const pt = nearestPoint(tracks, legMs);
        if (!pt) return;
        markers.push(
          new Marker({ element: createFlagEl(`Leg ${i + 1}`), anchor: 'bottom-left', offset: [0, 4] })
            .setLngLat([pt.lng, pt.lat])
            .addTo(map)
        );
      });

      // --- Patrol End label (only when patrol is Done/Cancelled) ---
      if (isTerminal) {
        const end = lastPoint(tracks);
        if (end) {
          markers.push(
            new Marker({ element: createTextLabelEl('Patrol End'), anchor: 'bottom-left', offset: [8, -4] })
              .setLngLat([end.lng, end.lat])
              .addTo(map)
          );
        }
      }

      // --- Demo event markers ---
      getDemoEvents(patrolId).forEach((ev) => {
        if (!ev.lat || !ev.lng) return;
        markers.push(
          new Marker({ element: createEventMarkerEl(ev), anchor: 'center' })
            .setLngLat([ev.lng, ev.lat])
            .addTo(map)
        );
      });
    };

    const safeAdd = () => { try { addMarkers(); } catch (_e) { /* ignore */ } };
    if (map.isStyleLoaded?.()) safeAdd();
    else {
      map.on('styledata', safeAdd);
      map.on('load', safeAdd);
    }

    return () => {
      try {
        map.off('styledata', safeAdd);
        map.off('load', safeAdd);
      } catch (_e) { /* ignore */ }
      markers.forEach((m) => m.remove());
    };
  // getDemoEvents is a stable module-level function (reads from sessionStorage) — no dep needed.
  }, [map, patrolId, tick, legsVersion, stateVersion]);

  // Camera move to the tracks — fires once per patrolId so switching patrols
  // always re-centres the map without needing to zoom out first.
  useEffect(() => {
    if (!map || flownToRef.current.has(patrolId)) return undefined;
    let done = false;
    const doFit = () => {
      if (done) return;
      const tracks = getPatrolTracks(patrolId);
      const allPts = Object.values(tracks).flatMap((pts) => pts || []);
      if (!allPts.length) return;
      done = true;
      let minLng = +Infinity, minLat = +Infinity, maxLng = -Infinity, maxLat = -Infinity;
      allPts.forEach((p) => {
        if (p.lng < minLng) minLng = p.lng;
        if (p.lng > maxLng) maxLng = p.lng;
        if (p.lat < minLat) minLat = p.lat;
        if (p.lat > maxLat) maxLat = p.lat;
      });
      try {
        // Left padding matches the patrol panel width (46rem ≈ 736px) so the
        // tracks are visible in the map area to the right of the panel.
        map.fitBounds([[minLng, minLat], [maxLng, maxLat]], {
          padding: { left: 756, top: 80, right: 80, bottom: 80 },
          duration: 800,
          maxZoom: 15,
        });
      } catch (_e) { /* ignore */ }
      flownToRef.current.add(patrolId);
    };
    if (map.isStyleLoaded?.()) doFit();
    else {
      map.on('styledata', doFit);
      map.on('load', doFit);
    }
    return () => {
      try {
        map.off('styledata', doFit);
        map.off('load', doFit);
      } catch (_e) { /* ignore */ }
    };
  }, [map, patrolId, tick]); // flownToRef is a ref — no need in deps

  // Add/update all map sources and layers.
  useEffect(() => {
    if (!map || !patrolId) return undefined;
    const addedIds = [];

    const addAllLayers = () => {
      ensureArrowImage(map);

      const tracks = getPatrolTracks(patrolId);
      const lastPositions = [];

      Object.entries(tracks).forEach(([name, points]) => {
        if (!points || points.length < 2) return;
        const safe = SAFE_ID(name);
        const srcId = sourceIdFor(patrolId, safe);
        const lineId = lineLayerIdFor(patrolId, safe);
        const arrowId = arrowLayerIdFor(patrolId, safe);
        const color = colorForEntity(name);

        // --- Line source & layer ---
        const lineData = buildLineFeature(points);
        const existingSrc = map.getSource(srcId);
        if (existingSrc) {
          existingSrc.setData(lineData);
        } else {
          map.addSource(srcId, { type: 'geojson', data: lineData });
          addedIds.push({ kind: 'source', id: srcId });
        }

        const visible = isEntityVisible(patrolId, name) ? 'visible' : 'none';

        if (!map.getLayer(lineId)) {
          map.addLayer({
            id: lineId,
            type: 'line',
            source: srcId,
            layout: { 'line-cap': 'round', 'line-join': 'round', visibility: visible },
            paint: { 'line-color': color, 'line-width': 3, 'line-opacity': 0.9 },
          });
          addedIds.push({ kind: 'layer', id: lineId });
        } else {
          map.setLayoutProperty(lineId, 'visibility', visible);
        }

        // --- Direction arrows along the line ---
        if (!map.getLayer(arrowId)) {
          map.addLayer({
            id: arrowId,
            type: 'symbol',
            source: srcId,
            layout: {
              'symbol-placement': 'line',
              'symbol-spacing': 55,
              'icon-image': ARROW_IMAGE_ID,
              'icon-size': 0.65,
              'icon-allow-overlap': true,
              'icon-ignore-placement': true,
              visibility: visible,
            },
            minzoom: 10,
          });
          addedIds.push({ kind: 'layer', id: arrowId });
        } else {
          map.setLayoutProperty(arrowId, 'visibility', visible);
        }

        // Collect last point for visible entities only.
        if (visible === 'visible') {
          const last = points[points.length - 1];
          lastPositions.push({ name, color, lat: last.lat, lng: last.lng });
        }
      });

      // Entity last-position circles intentionally omitted —
      // they rendered as plain coloured dots and were visually confusing.
      // Subject positions are already conveyed by where the track lines end.

      // (Event markers removed — real events render via the app's own EventsLayer)
    };

    const safeRun = () => {
      try { addAllLayers(); } catch (e) {
        console.error('[PatrolTracksLayer] add failed', e);
      }
    };

    if (map.isStyleLoaded?.()) safeRun();
    else {
      map.on('styledata', safeRun);
      map.on('load', safeRun);
    }

    return () => {
      try {
        map.off('styledata', safeRun);
        map.off('load', safeRun);
      } catch (_e) { /* ignore */ }
      addedIds.slice().reverse().forEach(({ kind, id }) => {
        try {
          if (kind === 'layer' && map.getLayer(id)) map.removeLayer(id);
          else if (kind === 'source' && map.getSource(id)) map.removeSource(id);
        } catch (_e2) { /* map may already be torn down */ }
      });
    };
  }, [map, patrolId, tick]);

  return null;
};

export default memo(PatrolTracksLayer);
