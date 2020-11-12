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
  const { map, patrol, updatePatrol, ...rest } = props;

  const onTitleClick = useCallback(() => {
    openModalForPatrol(patrol, map);
  }, [map, patrol]);

  const onPatrolChange = useCallback((value) => {
    const merged = merge(patrol, value);
    
    delete merged.updates;
    updatePatrol(merged);
  }, [patrol, updatePatrol]);

  return <Flipped flipId={patrol.id}>
    <PatrolCard
      ref={ref}
      onTitleClick={onTitleClick}
      onPatrolChange={onPatrolChange}
      patrol={patrol}
      map={map}
      {...rest} />
  </Flipped>;
});

const ConnectedListItem = connect(null, { updatePatrol })(PatrolListItem);

const PatrolList = (props) => {
  const { map, patrols = [], loading } = props;
  // const scrollRef = useRef(null);

  const [listItems, setListItems] = useState(patrols);

  useEffect(() => {
    setListItems(sortPatrolCards(patrols));

  }, [patrols]);


  if (loading) return <LoadingOverlay className={styles.loadingOverlay} />;

  return <Fragment>
    <PatrolListTitle />
    {!!listItems.length && <Flipper flipKey={listItems} element='ul' className={styles.patrolList}>

      {listItems.map((item, index) =>
        <ConnectedListItem
          patrol={item}
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
