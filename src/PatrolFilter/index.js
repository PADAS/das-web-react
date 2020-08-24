import React, { memo } from 'react';
import { connect } from 'react-redux';

import { updatePatrolFilter } from '../ducks/patrol-filter';
import { trackEvent } from '../utils/analytics';
import SearchBar from '../SearchBar';

import styles from './styles.module.scss';

const PatrolFilter = (props) => {

  const onClearSearch = (e) => {
    e.stopPropagation();
    updatePatrolFilter({
      filter: {text: ''}
    });
    trackEvent('MapPatrol List', 'Clear Search Text Filter');
  };

  const onSearchChange = ({ target: { value } }) => {
    updatePatrolFilter({
      filter: {
        text: !!value ? value.toLowerCase() : null,
      }
    });
    trackEvent('Patrol List', 'Change Search Text Filter');
  };

  return <form className={styles.form} onSubmit={e => e.preventDefault()}>
    <SearchBar className={styles.search} placeholder='Search Patrols...'
      onChange={onSearchChange} onClear={onClearSearch}/>
  </form>;
};

const mapStatetoProps = ({ data: { patrolFilter } }) => ({ patrolFilter });

export default connect(mapStatetoProps, { updatePatrolFilter })(memo(PatrolFilter));