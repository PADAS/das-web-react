import { useSyncExternalStore } from 'react';
import axios from 'axios';

import { calcGenericFallbackImageUrl, calcSpriteSvgUrl, calcUrlForImage, imgElFromSrc } from './img';
import { calcIconColorByPriority } from './event-types';
import { calcSvgImageIconId, EVENT_ICON_ID_PREFIX } from './mapImages';
import { MAP_ICON_SIZE, MAP_ICON_SCALE } from '../constants';

const REP_SUFFIX = '_rep';

const isClientError = (status) => typeof status === 'number' && status >= 400 && status < 500;

// Sprite markup shared across every priority/size variant of the same icon_id.
let spriteMarkupCache = {};
let spriteFetchesInFlight = {};

// Generated <img> elements, keyed by the icon variant id (calcSvgImageIconId).
const iconImageCache = new Map();
const iconGenerationsInFlight = new Map();

// Subscribers notified whenever an icon resolves, so React consumers re-render
// and DOM consumers (cluster markers) can repopulate.
const listeners = new Set();
let version = 0;

// The map an attached listener registers icons into. Only one map is attached
// at a time (the app owns a single map instance).
let attachedMap = null;
let warnedAboutRemovedMap = false;

// Full icon params primed by the GL feature owners (EventsLayer / EventsTileLayers)
// so the styleimagemissing handler can recover event context (color/state/image)
// that the parsed id alone can't carry. Keyed by the canonical variant id and
// bounded with FIFO eviction — feature collections can be large, and this holds
// only metadata (no images, no fetching).
const PRIMED_EVENT_ICON_PARAMS_MAX = 5000;
const primedEventIconParams = new Map();

const notify = () => {
  version += 1;
  listeners.forEach((listener) => listener());
};

const fetchSpriteSvgMarkup = async (spriteIconId) => {
  const response = await axios.get(calcSpriteSvgUrl(spriteIconId), {
    headers: {
      Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
    },
    responseType: 'text',
  });

  return response.data;
};

const fetchSpriteSvgMarkupWithRepFallback = async (spriteIconId) => {
  try {
    return await fetchSpriteSvgMarkup(spriteIconId);
  } catch (error) {
    if (isClientError(error?.response?.status) && !spriteIconId.endsWith(REP_SUFFIX)) {
      return fetchSpriteSvgMarkup(`${spriteIconId}${REP_SUFFIX}`);
    }
    throw error;
  }
};

const getSpriteSvgMarkup = (spriteIconId) => {
  if (spriteMarkupCache[spriteIconId]) {
    return Promise.resolve(spriteMarkupCache[spriteIconId]);
  }

  if (!spriteFetchesInFlight[spriteIconId]) {
    spriteFetchesInFlight[spriteIconId] = (async () => {
      try {
        const svgMarkup = await fetchSpriteSvgMarkupWithRepFallback(spriteIconId);
        spriteMarkupCache[spriteIconId] = svgMarkup;
        return svgMarkup;
      } finally {
        delete spriteFetchesInFlight[spriteIconId];
      }
    })();
  }

  return spriteFetchesInFlight[spriteIconId];
};

const calcScaledIconDimensions = ({ height, width = MAP_ICON_SIZE }) => [
  width * MAP_ICON_SCALE,
  height ? height * MAP_ICON_SCALE : undefined,
];

const renderGenericColorFallbackImage = (event) =>
  imgElFromSrc(calcGenericFallbackImageUrl(event), ...calcScaledIconDimensions(event));

// Recolors an event icon's SVG markup for the event's priority and rasterizes
// it into an <img> element via a data URI.
const renderColoredIconImage = (svgMarkup, event) => {
  const color = calcIconColorByPriority(event.priority);

  const svgEl = new DOMParser().parseFromString(svgMarkup, 'image/svg+xml').documentElement;

  svgEl.style.fill = `${color} !important`;
  svgEl.setAttribute('fill', color);

  svgEl.querySelectorAll('style').forEach((el) => el.remove());

  svgEl.querySelectorAll('*').forEach((node) => {
    ['class', 'style', 'fill', 'stroke'].forEach((attribute) => node.removeAttribute(attribute));
  });

  const serializedSvg = new XMLSerializer().serializeToString(svgEl);

  const dataUri = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(serializedSvg)}`;

  return imgElFromSrc(dataUri, ...calcScaledIconDimensions(event));
};

const renderFallbackEventImage = (event) => imgElFromSrc(calcUrlForImage(event.image), ...calcScaledIconDimensions(event));

// Generates the colored icon image for one variant, applying the sprite fetch
// and fallback semantics for event map icons. Resolves the generated <img>, or
// undefined when a transient failure should leave the icon to resolve on a
// later pass.
const generateEventIconImage = async (event) => {
  const spriteIconId = event.icon_id || 'generic';

  try {
    const svgMarkup = await getSpriteSvgMarkup(spriteIconId);
    return await renderColoredIconImage(svgMarkup, event);
  } catch (error) {
    if (isClientError(error?.response?.status)) {
      // A 4xx failure is permanent (the sprite won't appear on retry), so lock
      // in a usable fallback: the event's own image, then a generic per-color
      // icon, so the event never renders without any icon.
      try {
        return await renderFallbackEventImage(event);
      } catch {
        try {
          return await renderGenericColorFallbackImage(event);
        } catch (genericError) {
          console.warn('map icon fallback image failed to load', genericError);
          return undefined;
        }
      }
    }

    // A transient (5xx/network) or generation failure may succeed later. The
    // cached markup itself may be the culprit, so drop it and resolve without an
    // image so a later pass re-fetches instead of pinning a degraded fallback.
    // Retry is passive — the next styleimagemissing or marker pass re-attempts
    // — an accepted trade-off vs develop's store-driven retries.
    delete spriteMarkupCache[spriteIconId];
    console.warn('failed to generate map icon from sprite', error);
    return undefined;
  }
};

const registerIconOnMap = (mapImageId, image) => {
  if (!attachedMap) {
    return;
  }

  // Map teardown can precede detach (children unmount before the parent's
  // cleanup runs), so hasImage/addImage on a removed map throws. Guard so a late
  // registration can't surface as an unhandled rejection.
  try {
    if (!attachedMap.hasImage(mapImageId)) {
      attachedMap.addImage(mapImageId, image);
    }
  } catch (error) {
    if (!warnedAboutRemovedMap) {
      warnedAboutRemovedMap = true;
      console.warn('failed to register map icon; the map may have been removed', error);
    }
  }
};

// `registerId`, when passed, is the exact id Mapbox requested. Its empty slots
// can make it differ from the canonical cache key (e.g. "event-icon|fire|" vs
// "event-icon|fire"), so the image must register under the requested id or the
// waiting symbol never resolves; the cache stays keyed canonically.
const ensureEventIconForParams = (event, registerId) => {
  const iconVariantId = calcSvgImageIconId(event);
  const mapImageId = registerId ?? iconVariantId;

  const cached = iconImageCache.get(iconVariantId);
  if (cached) {
    registerIconOnMap(mapImageId, cached);
    return Promise.resolve(cached);
  }

  if (iconGenerationsInFlight.has(iconVariantId)) {
    const inFlight = iconGenerationsInFlight.get(iconVariantId);
    // A concurrent caller may be generating the canonical variant without this
    // caller's requested id; register under it once the shared work resolves.
    return registerId
      ? inFlight.then((image) => {
        if (image) {
          registerIconOnMap(mapImageId, image);
        }
        return image;
      })
      : inFlight;
  }

  const generation = generateEventIconImage(event)
    .then((image) => {
      if (image) {
        iconImageCache.set(iconVariantId, image);
        registerIconOnMap(mapImageId, image);
        notify();
      }
      return image;
    })
    .finally(() => {
      iconGenerationsInFlight.delete(iconVariantId);
    });

  iconGenerationsInFlight.set(iconVariantId, generation);

  return generation;
};

// An id slot is absent when undefined (fewer segments) or empty (a trailing
// pipe with nothing after it, e.g. "event-icon|fire|"); both mean "no value".
const parseNumericIdSlot = (value) => (value === undefined || value === '' ? undefined : Number(value));

// Stores full icon params for later styleimagemissing recovery. Metadata only —
// no image objects, no fetching. Keyed by the canonical variant id, capped with
// FIFO eviction so large feature collections can't grow the map unbounded.
export const primeEventIconParams = (features = []) => {
  features.forEach((feature) => {
    const properties = feature?.properties;
    if (!properties?.icon_id) {
      return;
    }

    const iconVariantId = calcSvgImageIconId(properties);
    if (primedEventIconParams.has(iconVariantId)) {
      return;
    }

    if (primedEventIconParams.size >= PRIMED_EVENT_ICON_PARAMS_MAX) {
      primedEventIconParams.delete(primedEventIconParams.keys().next().value);
    }

    primedEventIconParams.set(iconVariantId, {
      icon_id: properties.icon_id,
      priority: properties.priority,
      width: properties.width,
      height: properties.height,
      image: properties.image,
      color: properties.color,
      state: properties.state,
    });
  });
};

// Attaches a `styleimagemissing` listener that lazily generates event icons the
// symbol layers reference. Returns a detach function. Mapbox re-renders on its
// own once the image is added, so no manual re-render is needed here.
export const attachEventIconsToMap = (map) => {
  attachedMap = map;

  const handleStyleImageMissing = ({ id }) => {
    if (typeof id !== 'string' || !id.startsWith(EVENT_ICON_ID_PREFIX)) {
      return;
    }

    const [, icon_id, priority, width, height] = id.split('|');
    const parsedParams = {
      icon_id,
      priority: parseNumericIdSlot(priority),
      width: parseNumericIdSlot(width),
      height: parseNumericIdSlot(height),
    };

    // The parsed id can't carry color/state/image, so merge any primed params
    // (keyed by the canonical variant id) over it — this lets the permanent-4xx
    // fallback chain reach the event's own image and per-color generic icon.
    const primed = primedEventIconParams.get(calcSvgImageIconId(parsedParams));
    const params = primed ? { ...parsedParams, ...primed } : parsedParams;

    ensureEventIconForParams(params, id);
  };

  map.on('styleimagemissing', handleStyleImageMissing);

  return () => {
    map.off('styleimagemissing', handleStyleImageMissing);
    if (attachedMap === map) {
      attachedMap = null;
    }
  };
};

// Generates (or returns the cached) icon for a variant, used by DOM consumers
// whose features may never reach a GL symbol layer. Registers on the attached
// map when there is one.
export const ensureEventIcon = (event) => ensureEventIconForParams(event);

// Synchronously returns the cached <img> for a variant id, or undefined.
export const getEventIcon = (iconVariantId) => iconImageCache.get(iconVariantId);

export const subscribeEventIcons = (listener) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const useEventMapIconsVersion = () => useSyncExternalStore(subscribeEventIcons, () => version);

export const __resetEventIconsForTesting = () => {
  spriteMarkupCache = {};
  spriteFetchesInFlight = {};
  iconImageCache.clear();
  iconGenerationsInFlight.clear();
  primedEventIconParams.clear();
  listeners.clear();
  attachedMap = null;
  warnedAboutRemovedMap = false;
  version = 0;
};

export const __setEventIconForTesting = (iconVariantId, image) => {
  iconImageCache.set(iconVariantId, image);
};
