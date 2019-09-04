import React, { memo } from 'react';
import { connect } from 'react-redux';

// import isEqual from 'react-fast-compare';
import debounce from 'lodash/debounce';
//import isNil from 'lodash/isNil';
//import intersection from 'lodash/intersection';
//import uniq from 'lodash/uniq';

import { updateMapLayerFilter, INITIAL_FILTER_STATE } from '../ducks/map-layer-filter';
import { trackEvent } from '../utils/analytics';
import SearchBar from '../SearchBar';

import styles from './styles.module.scss';

const MapLayerFilter = memo((props) => {
  const { mapLayerFilter, updateMapLayerFilter } = props;
  const { state, filter: { text } } = mapLayerFilter;

  const updateMapLayerFilterDebounced = debounce(function (update) {
    updateMapLayerFilter(update);
  }, 200);

  // const resetStateFilter = (e) => {
  //   e.stopPropagation();
  //   updateMapLayerFilter({ state: INITIAL_FILTER_STATE.state });
  //   trackEvent('Map Layers', 'Click Reset State Filter');
  // };

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
    <SearchBar className={styles.search} placeholder='Search Layers...' text={text || ''} onChange={onSearchChange} />
  </form>;
});

const mapStatetoProps = ({ data: { mapLayerFilter } }) => ({ mapLayerFilter });

export default connect(mapStatetoProps, { updateMapLayerFilter })(MapLayerFilter);