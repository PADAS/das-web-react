import React, { useRef, memo } from 'react';
import { findDOMNode } from 'react-dom';
//import PropTypes from 'prop-types';
import InfiniteScroll from 'react-infinite-scroller';
import LoadingOverlay from '../LoadingOverlay';

import styles from './styles.module.scss';

const PatrolList = (props) => {
  const { className, patrols, onPatrolClick, loading } = props;

  const scrollRef = useRef(null);

  if (loading) return <LoadingOverlay className={styles.loadingOverlay} />;

  return (
    <div ref={scrollRef} className={`${className} ${styles.scrollContainer}`}>
      <InfiniteScroll
        element='ul'
        useWindow={false}
        getScrollParent={() => findDOMNode(scrollRef.current)} // eslint-disable-line react/no-find-dom-node
      >
        {/* {patrols.map((item, index) =>
          <PatrolListItem
            patrol={item}
            key={`${item.id}-${index}`}
            onPatrolClick={onPatrolClick} />
        )} */}
        {!patrols.length && <li className={`${styles.listItem} ${styles.loadMessage}`} key='no-patrols-to-display'>No patrols to display.</li>}
      </InfiniteScroll>
    </div>
  );
};

export default memo(PatrolList);

PatrolList.defaultProps = {
  onTitleClick(event) {
  },
};

PatrolList.propTypes = {

};