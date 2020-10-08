import React, { Fragment, /* useRef, */ memo, useCallback } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import merge from 'lodash/merge';
// import { findDOMNode } from 'react-dom';
import InfiniteScroll from 'react-infinite-scroller';
import LoadingOverlay from '../LoadingOverlay';
import PatrolListTitle from './Title';
import { openModalForPatrol } from '../utils/patrols';
import { updatePatrol } from '../ducks/patrols';

import styles from './styles.module.scss';
import PatrolCard from '../PatrolCard';

const PatrolListItem = (props) => {
  const { map, patrol, updatePatrol, ...rest } = props;
  
  const onTitleClick = useCallback(() => {
    openModalForPatrol(patrol, map);
  }, [map, patrol]);

  const onPatrolChange = useCallback((value) => {
    const merged = merge(patrol, value);
    
    delete merged.updates;
    updatePatrol(merged);
  }, [patrol, updatePatrol]);

  return <PatrolCard
    onTitleClick={onTitleClick}
    onTitleChange={onPatrolChange}
    onPatrolChange={onPatrolChange}
    patrol={patrol}
    map={map}
    {...rest} />;
};

const ConnectedListItem = connect(null, { updatePatrol })(PatrolListItem);

const PatrolList = (props) => {
  const { map, patrols, loading } = props;
  // const scrollRef = useRef(null);

  if (loading) return <LoadingOverlay className={styles.loadingOverlay} />;

  return <Fragment>
    <PatrolListTitle onPatrolJumpClick={onPatrolJumpClick}/>
    <InfiniteScroll
      useWindow={false}
      element='ul'
      className={styles.patrolList}
      // getScrollParent={() => findDOMNode(scrollRef.current)} // eslint-disable-line react/no-find-dom-node
    >
      {patrols.map((item, index) =>
        <ConnectedListItem
          patrol={item}
          map={map}
          key={`${item.id}-${index}`}/>
      )}
      {!patrols.length && <div className={`${styles.listItem} ${styles.loadMessage}`} key='no-patrols-to-display'>No patrols to display.</div>}
    </InfiniteScroll>
  </Fragment>;
};

export default memo(PatrolList);

PatrolList.propTypes = {
  patrols: PropTypes.array,
  loading: PropTypes.bool,
};