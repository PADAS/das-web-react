import React, { Fragment, /* useRef, */ memo, useCallback } from 'react';
import PropTypes from 'prop-types';
// import { findDOMNode } from 'react-dom';
import InfiniteScroll from 'react-infinite-scroller';
import LoadingOverlay from '../LoadingOverlay';
import PatrolListTitle from './Title';
import { openModalForPatrol, patrolsStartingToday } from '../utils/patrols';

import styles from './styles.module.scss';
import PatrolFeedCard from './PatrolFeedCard';

const PatrolList = (props) => {
  const { map, patrols, loading } = props;

  const onPatrolTitleClick = useCallback((patrol) => {
    openModalForPatrol(patrol, map);
  }, [map]);

  // const scrollRef = useRef(null);

  if (loading) return <LoadingOverlay className={styles.loadingOverlay} />;

  const startingPatrols = patrolsStartingToday(patrols);

  return <Fragment>
    <PatrolListTitle />
    <InfiniteScroll
      useWindow={false}
      element='ul'
      className={styles.patrolList}
      // getScrollParent={() => findDOMNode(scrollRef.current)} // eslint-disable-line react/no-find-dom-node
    >
      {startingPatrols.map((item, index) =>
        <PatrolFeedCard
          onPatrolTitleClick={onPatrolTitleClick}
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