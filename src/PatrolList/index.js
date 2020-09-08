import React, { useRef, memo } from 'react';
import PropTypes from 'prop-types';
// import { findDOMNode } from 'react-dom';
import InfiniteScroll from 'react-infinite-scroller';
import LoadingOverlay from '../LoadingOverlay';
import PatrolListItem from './PatrolListItem';

import styles from './styles.module.scss';

const PatrolList = (props) => {
  const { patrols, loading } = props;

  // const scrollRef = useRef(null);

  const onPatrolClick = (e) => {
    console.log('Click', e.target);
  };

  if (loading) return <LoadingOverlay className={styles.loadingOverlay} />;

  return (
    <InfiniteScroll
      useWindow={false}
      element='ul'
      className={styles.patrolList}
      // getScrollParent={() => findDOMNode(scrollRef.current)} // eslint-disable-line react/no-find-dom-node
    >
      {patrols.map((item, index) =>
        <PatrolListItem
          patrol={item}
          key={`${item.id}-${index}`}
          onPatrolClick={onPatrolClick} />
      )}
      {!patrols.length && <div className={`${styles.listItem} ${styles.loadMessage}`} key='no-patrols-to-display'>No patrols to display.</div>}
    </InfiniteScroll>
  );
};

export default memo(PatrolList);

PatrolList.propTypes = {
  patrols: PropTypes.array,
  loading: PropTypes.bool,
};