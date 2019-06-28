import React, { memo, Fragment, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { findDOMNode } from 'react-dom';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import InfiniteScroll from 'react-infinite-scroller';

import { getFeedIncidents } from '../selectors';
import { fetchIncidentFeed, fetchNextIncidentFeedPage } from '../ducks/events';

import ReportListItem from '../ReportListItem';

import { removeModal } from '../ducks/modals';

import styles from './styles.module.scss';

const { Header, Title, Body, Footer } = Modal;

const AddToIncidentModal = (props) => {
  const { id, incidents, removeModal, report_id, fetchIncidentFeed, fetchNextIncidentFeedPage } = props;
  console.log('props', props);
  const scrollRef = useRef(null);

  useEffect(() => {
    fetchIncidentFeed('is_collection=true');
  }, []);

  const onClick = (report) => console.log('clicked report', report);

  const onScroll = () => fetchNextIncidentFeedPage(incidents.next);;

  const hasMore = !!incidents.next;

  return <Fragment>
    <Header>
      <Title>Add to Incident</Title>
    </Header>
    <Body>
      <h3>Add to existing incident</h3>
      <div ref={scrollRef} className={styles.incidentScrollList}>
        <InfiniteScroll
          element='ul'
          // hasMore={hasMore}
          loadMore={onScroll}
          useWindow={false}
          getScrollParent={() => findDOMNode(scrollRef.current)} // eslint-disable-line react/no-find-dom-node
        >
          {incidents.results.map((report, index) =>
            <ReportListItem
              className={styles.listItem}
              showJumpButton={false}
              report={report}
              key={`${report.id}-${index}`}
              onTitleClick={onClick}
              onIconClick={onClick} />
          )}
          {hasMore && <li className={`${styles.listItem} ${styles.loadMessage}`} key={0}>Loading more events...</li>}
          {!hasMore && <li className={`${styles.listItem} ${styles.loadMessage}`} key='no-more-events-to-load'>No more events to display.</li>}
        </InfiniteScroll>
      </div>
      <Button>Add to new incident</Button>
    </Body>
    <Footer>
      <Button variant='secondary' onClick={() => removeModal(id)}>Cancel</Button>
    </Footer>
  </Fragment>;
};

const mapStateToProps = (state) => ({
  incidents: getFeedIncidents(state),
});

export default connect(mapStateToProps, { removeModal, fetchIncidentFeed: () => fetchIncidentFeed(), fetchNextIncidentFeedPage: () => fetchNextIncidentFeedPage(), })(memo(AddToIncidentModal));