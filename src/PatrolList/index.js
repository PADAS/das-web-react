import React, { forwardRef, Fragment, /* useRef, */ memo, useCallback, useState, useEffect } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import merge from 'lodash/merge';
// import { findDOMNode } from 'react-dom';
import { Flipper, Flipped } from 'react-flip-toolkit';
import LoadingOverlay from '../LoadingOverlay';
import PatrolListTitle from './Title';
import { openModalForPatrol, sortPatrolCards } from '../utils/patrols';
import { updatePatrol } from '../ducks/patrols';

import styles from './styles.module.scss';
import PatrolCard from '../PatrolCard';

const PatrolListItem = forwardRef((props, ref) => { /* eslint-disable-line react/display-name */
  const { map, onStateUpdateFromCard, patrolData, updatePatrol, ...rest } = props;

  const onTitleClick = useCallback(() => {
    openModalForPatrol(patrolData.patrol, map);
  }, [map, patrolData.patrol]);

  const onPatrolChange = useCallback((value) => {
    const merged = merge(patrolData.patrol, value);
    
    delete merged.updates;
    updatePatrol(merged);
  }, [patrolData.patrol, updatePatrol]);

  return <Flipped flipId={patrolData.patrol.id}>
    <PatrolCard
      ref={ref}
      onTitleClick={onTitleClick}
      onPatrolChange={onPatrolChange}
      onSelfManagedStateChange={onStateUpdateFromCard}
      patrolData={patrolData}
      map={map}
      {...rest} />
  </Flipped>;
});

const ConnectedListItem = connect(null, { updatePatrol })(PatrolListItem);

const PatrolList = (props) => {
  const { map, patrolData = [], loading } = props;
  // const scrollRef = useRef(null);

  const [listItems, setListItems] = useState(patrolData);

  const onStateUpdateFromCard = useCallback(() => {
    setListItems(sortPatrolCards(patrolData));
  }, [patrolData]);

  useEffect(() => {
    setListItems(sortPatrolCards(patrolData));
  }, [patrolData]);


  if (loading) return <LoadingOverlay className={styles.loadingOverlay} />;

  return <Fragment>
    <PatrolListTitle />
    {!!listItems.length && <Flipper flipKey={listItems} element='ul' className={styles.patrolList}>

      {listItems.map((item, index) =>
        <ConnectedListItem
          patrolData={item}
          onStateUpdateFromCard={onStateUpdateFromCard}
          map={map}
          key={item.id}/>
      )}
    </Flipper>}
    {!listItems.length && <div className={`${styles.listItem} ${styles.loadMessage}`} key='no-patrols-to-display'>No patrols to display.</div>}
  </Fragment>;
};

export default memo(PatrolList);

PatrolList.propTypes = {
  patrols: PropTypes.array,
  loading: PropTypes.bool,
};
