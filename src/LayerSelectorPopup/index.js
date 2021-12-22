import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { connect } from 'react-redux';

import { hidePopup } from '../ducks/popup';
import { calcImgIdFromUrlForMapImages, calcUrlForImage } from '../utils/img';
import { FEATURE_FLAGS, LAYER_IDS } from '../constants';
import { useFeatureFlag } from '../hooks';

import SearchBar from '../SearchBar';

import styles from './styles.module.scss';

const { EVENT_SYMBOLS } = LAYER_IDS;

const LayerSelectorPopup = ({ id, data, hidePopup, mapImages }) => {
  const { layers: layerList, onSelectSubject, onSelectEvent, onSelectSymbol } = data;

  const clusteringFeatureFlagEnabled = useFeatureFlag(FEATURE_FLAGS.CLUSTERING);

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

  const itemCountString = useMemo(() => {
    if (clusteringFeatureFlagEnabled) return null;

    const subjectCount = layers.filter(({ layer: { id: layerID } }) => !layerID.includes(EVENT_SYMBOLS)).length;
    const eventCount = layers.filter(({ layer: { id: layerID } }) => layerID.includes(EVENT_SYMBOLS)).length;

    let string = '';

    if (subjectCount) {
      string+= `${subjectCount} subject${subjectCount > 1 ? 's' : ''}`;
    }
    if (subjectCount && eventCount)  {
      string+= ', ';
    }
    if (eventCount) {
      string+= `${eventCount} report${eventCount > 1 ? 's' : ''}`;
    }
    return string;
  }, [clusteringFeatureFlagEnabled, layers]);

  const showFilterInput = useMemo(() => layerList.length > 5, [layerList.length]);

  useEffect(() => {
    if (!showFilterInput) {
      setFilter('');
    }
  }, [showFilterInput]);

  const handleClick = useCallback((event, feature) => {
    hidePopup(id);

    if (feature.properties?.content_type === 'observations.subject') {
      onSelectSubject({ event, layer: { geometry: feature.geometry, properties: feature.properties } });
    } else if (feature.properties?.event_type) {
      onSelectEvent({ event, layer: { geometry: feature.geometry, properties: feature.properties } });
    } else {
      onSelectSymbol(feature);
    }
  }, [hidePopup, id, onSelectEvent, onSelectSubject, onSelectSymbol]);

  return <>
    {!clusteringFeatureFlagEnabled && <h6>
      {itemCountString ? itemCountString : '0 items'} at this point {!!filter && <small>(filtered)</small>}
    </h6>}

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
          <img alt={layer.properties.display_title || layer.properties.name || layer.properties.title} src={imgSrc} />
          <span>{layer.properties.display_title || layer.properties.name || layer.properties.title}</span>
        </li>;
      })}
    </ul>
  </>;
};

const mapStateToProps = ({ view: { mapImages } }) => ({ mapImages });

export default connect(mapStateToProps, { hidePopup })(memo(LayerSelectorPopup));
