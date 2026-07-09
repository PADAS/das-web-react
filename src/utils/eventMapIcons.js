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

  svgEl.querySelectorAll('*').forEach((node) => {
    ['class', 'style', 'fill', 'stroke'].forEach((attribute) => node.removeAttribute(attribute));
  });

  const serializedSvg = new XMLSerializer()
    .serializeToString(svgEl)
    .replace(/<style>.*?<\/style>/g, '');

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
    delete spriteMarkupCache[spriteIconId];
    console.warn('failed to generate map icon from sprite', error);
    return undefined;
  }
};

const registerIconOnMap = (iconVariantId, image) => {
  if (attachedMap && !attachedMap.hasImage(iconVariantId)) {
    attachedMap.addImage(iconVariantId, image);
  }
};

const ensureEventIconForParams = (event) => {
  const iconVariantId = calcSvgImageIconId(event);

  const cached = iconImageCache.get(iconVariantId);
  if (cached) {
    registerIconOnMap(iconVariantId, cached);
    return Promise.resolve(cached);
  }

  if (iconGenerationsInFlight.has(iconVariantId)) {
    return iconGenerationsInFlight.get(iconVariantId);
  }

  const generation = generateEventIconImage(event)
    .then((image) => {
      if (image) {
        iconImageCache.set(iconVariantId, image);
        registerIconOnMap(iconVariantId, image);
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
    ensureEventIconForParams({
      icon_id,
      priority: priority === undefined ? undefined : Number(priority),
      width: width === undefined ? undefined : Number(width),
      height: height === undefined ? undefined : Number(height),
    });
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
  listeners.clear();
  attachedMap = null;
  version = 0;
};

export const __setEventIconForTesting = (iconVariantId, image) => {
  iconImageCache.set(iconVariantId, image);
};
