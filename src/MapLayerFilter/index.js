import React, { memo } from 'react';
import { connect } from 'react-redux';

import debounce from 'lodash/debounce';

import { updateMapLayerFilter } from '../ducks/map-layer-filter';
import { trackEvent } from '../utils/analytics';
import SearchBar from '../SearchBar';

import styles from './styles.module.scss';

const MapLayerFilter = (props) => {
  const { mapLayerFilter, updateMapLayerFilter } = props;
  const { filter: { text } } = mapLayerFilter;

  const updateMapLayerFilterDebounced = debounce(function (update) {
    updateMapLayerFilter(update);
  }, 200);

  const onClearSearch = (e) => {
    e.stopPropagation();
    updateMapLayerFilter({
      filter: {text: ''}
    });
    trackEvent('Map Layers', 'Clear Search Text Filter');
  };

  const onSearchChange = ({ target: { value } }) => {
    updateMapLayerFilterDebounced({
      filter: {
        text: !!value ? value.toLowerCase() : null,
      }
    });
    trackEvent('Map Layers', 'Change Search Text Filter');
  };

  return <form className={styles.form} onSubmit={e => e.preventDefault()}>
    <span className={styles.searchLabel}>Display on map:</span>
    <SearchBar className={styles.search} placeholder='Search Layers...' text={text || ''} 
      onChange={onSearchChange} onClear={onClearSearch}/>
  </form>;
};

const mapStatetoProps = ({ data: { mapLayerFilter } }) => ({ mapLayerFilter });

export default connect(mapStatetoProps, { updateMapLayerFilter })(memo(MapLayerFilter));