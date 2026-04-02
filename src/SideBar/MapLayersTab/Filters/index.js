import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { MAP_LAYERS_CATEGORY, trackEventFactory } from '../../../utils/analytics';
import {
  setMapLayersFilterText,
} from '../../../ducks/map-layer-filter';
import { TAB_KEYS } from '../utils/constants';

import SearchBar from '../../../SearchBar';
import SidebarListSortingControls from '../../SidebarListSortingControls';

import * as styles from './styles.module.scss';

const mapLayersTracker = trackEventFactory(MAP_LAYERS_CATEGORY);

const Filters = ({ tab }) => {
  const dispatch = useDispatch();
  const { t } = useTranslation('filters', { keyPrefix: 'mapLayerFilter' });

  const mapLayerFilter = useSelector((state) => state.data.mapLayerFilter);

  const onSearchBarChange = (event) => {
    dispatch(setMapLayersFilterText(event.target.value));

    mapLayersTracker.track('Change Search Text Filter');
  };

  const onSearchBarClear = () => {
    dispatch(setMapLayersFilterText(''));

    mapLayersTracker.track('Clear Search Text Filter');
  };

  return <form
      aria-label={t('formLabel')}
      className={styles.form}
      onSubmit={(event) => event.preventDefault()}
      role="search"
    >
    <SearchBar
      aria-label={t('searchBarLabel')}
      className={styles.searchBar}
      name="map-layers-search-bar"
      onChange={onSearchBarChange}
      onClear={onSearchBarClear}
      placeholder={t('searchBarPlaceholder')}
      title={t('searchBarLabel')}
      value={mapLayerFilter.text}
    />

    {tab === TAB_KEYS.SUBJECTS && <SidebarListSortingControls />}
  </form>;
};

export default Filters;
