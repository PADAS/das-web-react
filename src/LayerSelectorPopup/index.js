import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { center } from '@turf/turf';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { calcImgIdFromUrlForMapImages, calcUrlForImage } from '../utils/img';
import { hidePopup } from '../ducks/popup';
import { GEAR_FEATURE_CONTENT_TYPE, SUBJECT_FEATURE_CONTENT_TYPE } from '../constants';
import { subjectIsStatic } from '../utils/subjects';

import SearchBar from '../SearchBar';

import * as styles from './styles.module.scss';

const LayerSelectorPopup = ({ data, id }) => {
  const dispatch = useDispatch();
  const { t } = useTranslation('map-popups', { keyPrefix: 'layerSelectorPopup' });

  const mapImages = useSelector((state) => state.view.mapImages);

  const [filter, setFilter] = useState('');

  const { layers: layerList, onSelectEvent, onSelectGear, onSelectSubject } = data;
  const showFilterInput = layerList.length > 5;

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
      const isGearLayerItem = layer.properties?.content_type === GEAR_FEATURE_CONTENT_TYPE;
      const imageinStore = !isGearLayerItem && mapImages[
        calcImgIdFromUrlForMapImages(layer.properties.image, layer.properties.height, layer.properties.width)
      ];
      const imgSrc = imageinStore
        ? imageinStore.image.src
        : calcUrlForImage(layer.properties.image || layer.properties.image_url);

      const listLabel = layer.properties.display_title || layer.properties.name || layer.properties.title;

      return <li className={styles.listItem} key={layer.properties.id} onClick={(e) => handleClick(e, layer)}>
        {isGearLayerItem
          ? <span className={styles.listItemGearIcon} />
          : <img
            alt={listLabel}
            src={imgSrc}
            style={subjectIsStatic(layer) ? { filter: 'brightness(0) opacity(60%)' } : {}}
          />}

        <span>{listLabel}</span>
      </li>;
    });
  }, [filter, handleClick, layerList, mapImages]);

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
