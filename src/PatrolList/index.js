import React, { useRef, memo } from 'react';
import { findDOMNode } from 'react-dom';
//import PropTypes from 'prop-types';
import InfiniteScroll from 'react-infinite-scroller';
import LoadingOverlay from '../LoadingOverlay';
import PatrolListItem from './PatrolListItem';
import { chunk } from 'lodash';

import styles from './styles.module.scss';

const PatrolList = (props) => {
  const { patrols, loading } = props;

  const scrollRef = useRef(null);

  const onPatrolClick = (e) => {
    console.log('Click', e.target);
  };

  if (loading) return <LoadingOverlay className={styles.loadingOverlay} />;

  // 2 x 2. 
  const patrolRows = chunk(patrols, 2);

  return (
    // <div className={styles.listHeader}>CURRENT PATROLS</div>
    <div ref={scrollRef} className={styles.patrolList}>
      <InfiniteScroll
        useWindow={false}
        getScrollParent={() => findDOMNode(scrollRef.current)} // eslint-disable-line react/no-find-dom-node
      >
        {patrolRows.map((row, rowid) => 
          <div key={rowid} className={styles.patrolRow}>
            {row.map((item, index) =>
              <PatrolListItem
                patrol={item}
                key={`${item.id}-${index}`}
                onPatrolClick={onPatrolClick} />
            )}
          </div>
        )}

        {!patrols.length && <div className={`${styles.listItem} ${styles.loadMessage}`} key='no-patrols-to-display'>No patrols to display.</div>}
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