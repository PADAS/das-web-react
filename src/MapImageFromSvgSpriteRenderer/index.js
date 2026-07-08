import React, { memo, useEffect, useRef } from 'react';
import axios from 'axios';
import { useDispatch, useSelector } from 'react-redux';

import { addImageToMapIfNecessary } from '../ducks/map-images';
import { calcGenericFallbackImageUrl, calcSpriteSvgUrl, calcUrlForImage, imgElFromSrc } from '../utils/img';
import { calcIconColorByPriority } from '../utils/event-types';
import { MAP_ICON_SIZE, MAP_ICON_SCALE } from '../constants';

const EMPTY_FEATURE_COLLECTION = { features: [] };

const isClientError = (status) => typeof status === 'number' && status >= 400 && status < 500;

const REP_SUFFIX = '_rep';

// Builds the map-image cache key for an event's icon. Must match the suffix order
// used by the Mapbox icon-image expressions (icon_id-priority-width-height).
export const calcSvgImageIconId = ({ icon_id, priority, width, height }) => {
  const variantSuffixParts = [priority, width, height].filter((value) => value === 0 || Boolean(value));
  return [icon_id, ...variantSuffixParts].join('-');
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

const MapImageFromSvgSpriteRenderer = ({ eventFeatureCollection = EMPTY_FEATURE_COLLECTION }) => {
  const dispatch = useDispatch();
  const mapImages = useSelector((state) => state.view.mapImages);

  const spriteMarkupCache = useRef({});
  const spriteFetchesInFlight = useRef({});
  const iconsBeingGenerated = useRef(new Set());

  useEffect(() => {
    const getSpriteSvgMarkup = (spriteIconId) => {
      if (spriteMarkupCache.current[spriteIconId]) {
        return Promise.resolve(spriteMarkupCache.current[spriteIconId]);
      }

      if (!spriteFetchesInFlight.current[spriteIconId]) {
        spriteFetchesInFlight.current[spriteIconId] = (async () => {
          try {
            const svgMarkup = await fetchSpriteSvgMarkupWithRepFallback(spriteIconId);
            spriteMarkupCache.current[spriteIconId] = svgMarkup;
            return svgMarkup;
          } finally {
            delete spriteFetchesInFlight.current[spriteIconId];
          }
        })();
      }

      return spriteFetchesInFlight.current[spriteIconId];
    };

    const resolveAndRegisterIcon = async ({ event, iconVariantId, spriteIconId }) => {
      try {
        const svgMarkup = await getSpriteSvgMarkup(spriteIconId);
        const image = await renderColoredIconImage(svgMarkup, event);
        dispatch(addImageToMapIfNecessary({ icon_id: iconVariantId, image }));
      } catch (error) {
        if (isClientError(error?.response?.status)) {
          // A 4xx failure is permanent (the sprite won't appear on retry), so
          // lock in a usable fallback: the event's own image, then a generic
          // per-color icon, so the event never renders without any icon.
          try {
            const image = await renderFallbackEventImage(event);
            dispatch(addImageToMapIfNecessary({ icon_id: iconVariantId, image }));
          } catch {
            try {
              const image = await renderGenericColorFallbackImage(event);
              dispatch(addImageToMapIfNecessary({ icon_id: iconVariantId, image }));
            } catch (genericError) {
              console.warn('map icon fallback image failed to load', genericError);
            }
          }
        } else {
          // A transient (5xx/network) or generation failure may succeed later.
          // The cached markup itself may be the culprit, so drop it, and leave
          // the icon unregistered so a later pass re-fetches instead of pinning
          // a degraded fallback the write-once store would never replace.
          delete spriteMarkupCache.current[spriteIconId];
          console.warn('failed to generate map icon from sprite', error);
        }
      } finally {
        iconsBeingGenerated.current.delete(iconVariantId);
      }
    };

    // Many events share the same icon variant (event type + priority + size),
    // so only one generation task is queued per distinct variant.
    const iconTasksByVariantId = new Map();

    eventFeatureCollection.features.forEach(({ properties: event }) => {
      const iconVariantId = calcSvgImageIconId(event);
      const alreadyHandled = mapImages[iconVariantId]
        || iconsBeingGenerated.current.has(iconVariantId)
        || iconTasksByVariantId.has(iconVariantId);

      if (!alreadyHandled) {
        iconTasksByVariantId.set(iconVariantId, {
          event,
          iconVariantId,
          spriteIconId: event.icon_id || 'generic',
        });
      }
    });

    iconTasksByVariantId.forEach((task) => {
      iconsBeingGenerated.current.add(task.iconVariantId);
      resolveAndRegisterIcon(task);
    });
  }, [eventFeatureCollection, mapImages, dispatch]);

  return null;
};

export default memo(MapImageFromSvgSpriteRenderer);
