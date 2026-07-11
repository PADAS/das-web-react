import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { center } from '@turf/turf';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { calcImgIdFromUrlForMapImages, calcSpriteSvgUrl, calcUrlForImage } from '../utils/img';
import { calcSvgImageIconId } from '../utils/mapImages';
import { createFeatureCollectionFromEvents } from '../utils/map';
import { ensureEventIcon, getEventIcon, useEventMapIconsVersion } from '../utils/eventMapIcons';
import { GEAR_FEATURE_CONTENT_TYPE, SUBJECT_FEATURE_CONTENT_TYPE } from '../constants';
import { hidePopup } from '../ducks/popup';
import { subjectIsStatic } from '../utils/subjects';

import SearchBar from '../SearchBar';

import * as styles from './styles.module.scss';

// Resolves the icon variant params for an event layer item. For the
// locally-edited event, reflect its unsaved icon_id/priority so the popup
// mirrors the edit in progress.
const eventIconParamsForLayer = (layerProperties, locallyEditedEvent) => {
  const isLocallyEdited = locallyEditedEvent?.id === layerProperties.id;
  return isLocallyEdited
    ? {
      ...layerProperties,
      icon_id: locallyEditedEvent.icon_id ?? layerProperties.icon_id,
      priority: locallyEditedEvent.priority ?? layerProperties.priority,
    }
    : layerProperties;
};

const LayerSelectorPopup = ({ data, id }) => {
  const dispatch = useDispatch();
  const { t } = useTranslation('map-popups', { keyPrefix: 'layerSelectorPopup' });

  const mapImages = useSelector((state) => state.view.mapImages);
  const eventStore = useSelector((state) => state.data?.eventStore);
  const eventTypes = useSelector((state) => state.data?.eventTypes);
  const locallyEditedEvent = useSelector((state) => state.data.locallyEditedEvent);

  // Re-render when the event icon registry resolves a new icon.
  const eventIconsVersion = useEventMapIconsVersion();

  const [filter, setFilter] = useState('');

  const { layers: layerList, onSelectEvent, onSelectGear, onSelectSubject } = data;
  const showFilterInput = layerList.length > 5;

  // Event features from the vector tile carry an unreliable image/image_url,
  // so always prefer the event store's flattened props when the event is
  // loaded there.
  const hydratedLayerList = useMemo(() => layerList.map((layer) => {
    const eventId = layer.properties?.id;
    const storeEvent = eventId && eventStore?.[eventId];
    const [hydrated] = storeEvent
      ? createFeatureCollectionFromEvents([storeEvent], eventTypes ?? []).features
      : [];
    if (hydrated) {
      return hydrated;
    }

    if (layer.properties?.icon_id && layer.properties?.event_type) {
      return {
        ...layer,
        properties: { ...layer.properties, image: calcSpriteSvgUrl(layer.properties.icon_id) },
      };
    }
    return layer;
  }), [layerList, eventStore, eventTypes]);

  // Cluster-hidden events may never reach a GL symbol layer, so their icons are
  // never requested. Proactively generate any missing ones here; the
  // useEventMapIconsVersion() subscription re-renders once they resolve. Runs
  // over the hydrated list (not on every filter keystroke, which lives in state).
  useEffect(() => {
    hydratedLayerList.forEach((layer) => {
      const isEventLayerItem = !!layer.properties?.icon_id && !!layer.properties?.event_type;
      if (!isEventLayerItem) {
        return;
      }

      const iconParams = eventIconParamsForLayer(layer.properties, locallyEditedEvent);
      if (!getEventIcon(calcSvgImageIconId(iconParams))) {
        ensureEventIcon(iconParams);
      }
    });
  }, [hydratedLayerList, locallyEditedEvent]);

  const handleClick = useCallback((event, feature) => {
    dispatch(hidePopup(id));

    if (feature.properties?.content_type === GEAR_FEATURE_CONTENT_TYPE) {
      const coordinates = feature.geometry?.type === 'Point'
        ? feature.geometry.coordinates
        : center(feature).geometry.coordinates;
      onSelectGear?.({
        coordinates,
        layer: { geometry: feature.geometry, properties: feature.properties },
      });
      return;
    }

    if (feature.properties?.content_type === SUBJECT_FEATURE_CONTENT_TYPE) {
      onSelectSubject({ event, layer: { geometry: feature.geometry, properties: feature.properties } });
    } else {
      onSelectEvent({ event, layer: { geometry: feature.geometry, properties: feature.properties } });
    }
  }, [dispatch, id, onSelectEvent, onSelectGear, onSelectSubject]);

  const renderedLayerListItems = useMemo(() => {
    const sortedLayerList = [...hydratedLayerList].sort((a, b) => {
      const first = (a.properties.display_title || a.properties.name || '').toLowerCase();
      const second = (b.properties.display_title || b.properties.name || '').toLowerCase();

      return first > second ? 1 : first < second ? -1 : 0;
    });

    const filteredLayerList = !filter
      ? sortedLayerList
      : sortedLayerList.filter((layer) => {
        const displayName = layer.properties.display_title || layer.properties.name || layer.properties.title || '';
        return displayName.toLowerCase().includes(filter.toLowerCase());
      });

    return filteredLayerList.map((layer) => {
      const isGearLayerItem = layer.properties?.content_type === GEAR_FEATURE_CONTENT_TYPE;
      const isEventLayerItem = !!layer.properties?.icon_id && !!layer.properties?.event_type;
      const isLocallyEdited = isEventLayerItem && locallyEditedEvent?.id === layer.properties.id;

      // Event icons come from the event icon registry; subject/other icons come
      // from state.view.mapImages, keyed by their source URL.
      let cachedImageSrc = null;
      if (!isGearLayerItem) {
        if (isEventLayerItem) {
          const eventIconKey = calcSvgImageIconId(eventIconParamsForLayer(layer.properties, locallyEditedEvent));
          cachedImageSrc = getEventIcon(eventIconKey)?.src ?? null;
        } else {
          const mapImagesKey = calcImgIdFromUrlForMapImages(
            layer.properties.image,
            layer.properties.height,
            layer.properties.width
          );
          cachedImageSrc = mapImages[mapImagesKey]?.image?.src ?? null;
        }
      }
      const imgSrc = cachedImageSrc ?? calcUrlForImage(layer.properties.image || layer.properties.image_url);

      const listLabel = layer.properties.display_title || layer.properties.name || layer.properties.title;

      return <li className={styles.listItem} key={layer.properties.id} onClick={(e) => handleClick(e, layer)}>
        {isGearLayerItem
          ? <span className={styles.listItemGearIcon} />
          : <img
            alt={listLabel}
            src={imgSrc}
            style={subjectIsStatic(layer) ? { filter: 'brightness(0) opacity(60%)' } : {}}
          />}

        <span>
          {/* Visual `*` marks unsaved changes; role="img" + aria-label makes
              screen readers announce the meaning instead of reading "star". */}
          {isLocallyEdited && <span role="img" aria-label={t('unsavedChangesLabel')}>{'* '}</span>}
          {listLabel}
        </span>
      </li>;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- eventIconsVersion is read only to recompute when the event icon registry resolves a new icon
  }, [eventIconsVersion, filter, handleClick, hydratedLayerList, locallyEditedEvent, mapImages, t]);

  const onFilterChange = useCallback((value) => setFilter(value), []);

  useEffect(() => {
    if (!showFilterInput) {
      setFilter('');
    }
  }, [showFilterInput]);

  return <>
    {showFilterInput && <SearchBar
      className={styles.filterInput}
      onChange={(event) => onFilterChange(event.target.value)}
      onClear={() => onFilterChange('')}
      placeholder={t('searchBarPlaceholder')}
      value={filter}
    />}

    <ul className={styles.list}>{renderedLayerListItems}</ul>
  </>;
};

export default memo(LayerSelectorPopup);
