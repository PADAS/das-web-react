import React, { useCallback, useContext } from 'react';

import { LayerFilterContext } from './context';
import { trackEventFactory, MAP_LAYERS_CATEGORY } from '../utils/analytics';
import SearchBar from '../SearchBar';

import styles from './styles.module.scss';

const mapLayerTracker = trackEventFactory(MAP_LAYERS_CATEGORY);

const MapLayerFilter = () => {

  const { filterText, setFilterValue } = useContext(LayerFilterContext);

  const onClearSearch = useCallback((e) => {
    e.stopPropagation();
    setFilterValue('');
    mapLayerTracker.track('Clear Search Text Filter');
  }, [setFilterValue]);

  const onSearchChange = useCallback(({ target: { value } }) => {
    setFilterValue(!!value ? value.toLowerCase() : '');
    mapLayerTracker.track('Change Search Text Filter');
  }, [setFilterValue]);

  const onSubmit = useCallback((e) => {
    e.preventDefault();
  }, []);

  return <form className={styles.form} onSubmit={onSubmit}>
    <SearchBar className={styles.search} placeholder='Search Layers...' value={filterText}
      onChange={onSearchChange} onClear={onClearSearch}/>
  </form>;
};

export default MapLayerFilter;