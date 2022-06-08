import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { connect } from 'react-redux';

import { hidePopup } from '../ducks/popup';
import { calcImgIdFromUrlForMapImages, calcUrlForImage } from '../utils/img';
import { SUBJECT_FEATURE_CONTENT_TYPE } from '../constants';
import { subjectIsStatic } from '../utils/subjects';

import SearchBar from '../SearchBar';

import styles from './styles.module.scss';


const LayerSelectorPopup = ({ id, data, hidePopup, mapImages }) => {
  const { layers: layerList, onSelectSubject, onSelectEvent } = data;

  const [filter, setFilter] = useState('');

  const onFilterChange = useCallback((value) => {
    setFilter(value);
  }, []);

  const layers = useMemo(() => {
    const sortedLayerList = layerList.sort((a, b) => {
      const first = (a.properties.display_title || a.properties.name || '').toLowerCase();
      const second = (b.properties.display_title || b.properties.name || '').toLowerCase();
      return first > second ? 1 : first < second ? -1 : 0;
    });

    if (!filter) return sortedLayerList;

    return sortedLayerList.filter((layer) => {
      const displayName = layer.properties.display_title || layer.properties.name || layer.properties.title;
      return displayName.toLowerCase().includes(filter.toLowerCase());
    });
  }, [filter, layerList]);


  const showFilterInput = useMemo(() => layerList.length > 5, [layerList.length]);

  useEffect(() => {
    if (!showFilterInput) {
      setFilter('');
    }
  }, [showFilterInput]);

  const handleClick = useCallback((event, feature) => {
    hidePopup(id);

    if (feature.properties?.content_type === SUBJECT_FEATURE_CONTENT_TYPE) {
      onSelectSubject({ event, layer: { geometry: feature.geometry, properties: feature.properties } });
    } else {
      onSelectEvent({ event, layer: { geometry: feature.geometry, properties: feature.properties } });
    }
  }, [hidePopup, id, onSelectEvent, onSelectSubject]);

  return <>

    {showFilterInput && <SearchBar
      className={styles.filterInput}
      placeholder='Search'
      value={filter}
      onChange={({ target: { value } }) => onFilterChange(value)}
      onClear={() => onFilterChange('')} />
    }

    <ul className={styles.list}>
      {layers.map(layer => {
        const imageinStore = mapImages[calcImgIdFromUrlForMapImages(layer.properties.image, layer.properties.height, layer.properties.width)];
        const imgSrc = imageinStore ?
          imageinStore.image.src
          : calcUrlForImage(layer.properties.image);

        return <li className={styles.listItem} key={layer.properties.id} onClick={(e) => handleClick(e, layer)}>
          <img
            alt={layer.properties.display_title || layer.properties.name || layer.properties.title}
            src={imgSrc}
            style={{ ...(subjectIsStatic(layer) ? { filter: 'invert(1) opacity(60%)' } : {}) }}
          />
          <span>{layer.properties.display_title || layer.properties.name || layer.properties.title}</span>
        </li>;
      })}
    </ul>
  </>;
};

const mapStateToProps = ({ view: { mapImages } }) => ({ mapImages });

export default connect(mapStateToProps, { hidePopup })(memo(LayerSelectorPopup));
