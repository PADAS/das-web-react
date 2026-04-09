import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { calcImgIdFromUrlForMapImages, calcUrlForImage } from '../utils/img';
import { calcSvgImageIconId } from '../MapImageFromSvgSpriteRenderer';
import { hidePopup } from '../ducks/popup';
import { SUBJECT_FEATURE_CONTENT_TYPE } from '../constants';
import { subjectIsStatic } from '../utils/subjects';

import SearchBar from '../SearchBar';

import * as styles from './styles.module.scss';

const LayerSelectorPopup = ({ data, id }) => {
  const dispatch = useDispatch();
  const { t } = useTranslation('map-popups', { keyPrefix: 'layerSelectorPopup' });

  const mapImages = useSelector((state) => state.view.mapImages);
  const eventStore = useSelector((state) => state.data.eventStore);
  const locallyEditedEvent = useSelector((state) => state.data.locallyEditedEvent);

  const [filter, setFilter] = useState('');

  const { layers: layerList, onSelectEvent, onSelectSubject } = data;
  const showFilterInput = layerList.length > 5;

  const handleClick = useCallback((event, feature) => {
    dispatch(hidePopup(id));

    if (feature.properties?.content_type === SUBJECT_FEATURE_CONTENT_TYPE) {
      onSelectSubject({ event, layer: { geometry: feature.geometry, properties: feature.properties } });
    } else {
      onSelectEvent({ event, layer: { geometry: feature.geometry, properties: feature.properties } });
    }
  }, [dispatch, id, onSelectEvent, onSelectSubject]);

  const renderedLayerListItems = useMemo(() => {
    const sortedLayerList = layerList.sort((a, b) => {
      const first = (a.properties.display_title || a.properties.name || '').toLowerCase();
      const second = (b.properties.display_title || b.properties.name || '').toLowerCase();

      return first > second ? 1 : first < second ? -1 : 0;
    });

    const filteredLayerList = !filter
      ? sortedLayerList
      : sortedLayerList.filter((layer) => {
        const displayName = layer.properties.display_title || layer.properties.name || layer.properties.title;
        return displayName.toLowerCase().includes(filter.toLowerCase());
      });

    return filteredLayerList.map((layer) => {
      const isEvent = layer.properties?.content_type !== SUBJECT_FEATURE_CONTENT_TYPE;
      const isLocallyEdited = isEvent && locallyEditedEvent?.id === layer.properties.id;
      const liveEvent = isLocallyEdited ? locallyEditedEvent : (isEvent ? eventStore[layer.properties.id] : null);
      const eventIconKey = isEvent && (liveEvent?.icon_id || layer.properties.icon_id)
        ? calcSvgImageIconId({
          icon_id: liveEvent?.icon_id ?? layer.properties.icon_id,
          priority: liveEvent?.priority ?? layer.properties.priority,
        })
        : null;
      const imageinStore = (eventIconKey && mapImages[eventIconKey])
        || mapImages[calcImgIdFromUrlForMapImages(layer.properties.image, layer.properties.height, layer.properties.width)];
      const imgSrc = imageinStore
        ? imageinStore.image.src
        : calcUrlForImage(layer.properties.image || layer.properties.image_url);

      const displayTitle = layer.properties.display_title || layer.properties.name || layer.properties.title;
      const title = isLocallyEdited ? `* ${displayTitle}` : displayTitle;

      return <li className={styles.listItem} key={layer.properties.id} onClick={(e) => handleClick(e, layer)}>
        <img
          alt={displayTitle}
          src={imgSrc}
          style={subjectIsStatic(layer) ? { filter: 'brightness(0) opacity(60%)' } : {}}
        />

        <span>{title}</span>
      </li>;
    });
  }, [eventStore, filter, handleClick, layerList, locallyEditedEvent, mapImages]);

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
