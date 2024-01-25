import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { calcImgIdFromUrlForMapImages, calcUrlForImage } from '../utils/img';
import { hidePopup } from '../ducks/popup';
import { SUBJECT_FEATURE_CONTENT_TYPE } from '../constants';
import { subjectIsStatic } from '../utils/subjects';

import SearchBar from '../SearchBar';

import styles from './styles.module.scss';

const LayerSelectorPopup = ({ data, id }) => {
  const dispatch = useDispatch();
  const { t } = useTranslation('map-popups', { keyPrefix: 'layerSelectorPopup' });

  const mapImages = useSelector((state) => state.view.mapImages);

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
      const imageinStore = mapImages[
        calcImgIdFromUrlForMapImages(layer.properties.image, layer.properties.height, layer.properties.width)
      ];
      const imgSrc = imageinStore
        ? imageinStore.image.src
        : calcUrlForImage(layer.properties.image || layer.properties.image_url);

      return <li className={styles.listItem} key={layer.properties.id} onClick={(e) => handleClick(e, layer)}>
        <img
          alt={layer.properties.display_title || layer.properties.name || layer.properties.title}
          src={imgSrc}
          style={subjectIsStatic(layer) ? { filter: 'brightness(0) opacity(60%)' } : {}}
        />

        <span>{layer.properties.display_title || layer.properties.name || layer.properties.title}</span>
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

LayerSelectorPopup.propTypes = {
  data: PropTypes.shape({
    layers: PropTypes.arrayOf(PropTypes.shape({
      properties: PropTypes.shape({
        display_title: PropTypes.string,
        height: PropTypes.string,
        id: PropTypes.string,
        image: PropTypes.string,
        image_url: PropTypes.string,
        name: PropTypes.string,
        title: PropTypes.string,
        width: PropTypes.string,
      }),
    })),
    onSelectSubject: PropTypes.func,
    onSelectEvent: PropTypes.func,
  }).isRequired,
  id: PropTypes.string.isRequired,
};

export default memo(LayerSelectorPopup);
