import React, { memo, Fragment, useRef, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { findDOMNode } from 'react-dom';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import InfiniteScroll from 'react-infinite-scroller';

import { getFeedIncidents } from '../selectors';
import { fetchIncidentFeed, fetchNextIncidentFeedPage } from '../ducks/events';
import { removeModal } from '../ducks/modals';
import { trackEvent } from '../utils/analytics';

import LoadingOverlay from '../LoadingOverlay';
import ReportListItem from '../ReportListItem';

import styles from './styles.module.scss';

const { Header, Title, Body, Footer } = Modal;

const AddToIncidentModal = (props) => {
  const { id, incidents, removeModal,
    fetchIncidentFeed, fetchNextIncidentFeedPage, onAddToExistingIncident, onAddToNewIncident
  } = props;

  const scrollRef = useRef(null);
  const [loaded, setLoadedState] = useState(false);

  const hideModal = () => {
    removeModal(id);
  };



  useEffect(() => {
    const fetchFeed = async () => {
      await fetchIncidentFeed({}, 'is_collection=true');
      setLoadedState(true);
    };
    fetchFeed();
  }, []); // eslint-disable-line

  const onExistingIncidentClick = (report) => {
    onAddToExistingIncident(report);
    hideModal();
    trackEvent('Add To Incident', 'Click Add to Existing Incident');
  };

  const onClickAddNewIncident = () => {
    onAddToNewIncident();
    hideModal();
    trackEvent('Add To Incident', 'Click Add to new Incident');
  };

  const onScroll = () => {
    if (!incidents.next) return null;
    return fetchNextIncidentFeedPage(incidents.next);
  };

  const hasMore = !loaded || !!incidents.next;

  return <Fragment>
    <Header>
      <Title>Add to Incident</Title>
    </Header>
    <Body>
      {!loaded && <LoadingOverlay />}
      <div ref={scrollRef} className={styles.incidentScrollList}>
        <InfiniteScroll
          element='ul'
          hasMore={hasMore}
          loadMore={onScroll}
          useWindow={false}
          getScrollParent={() => findDOMNode(scrollRef.current)}> {/* eslint-disable-line react/no-find-dom-node */}

          {incidents.results.map((report, index) =>
            <ReportListItem
              className={styles.listItem}
              showJumpButton={false}
              report={report}
              key={`${report.id}-${index}`}
              onTitleClick={onExistingIncidentClick}
              onIconClick={onExistingIncidentClick} />
          )}
          {hasMore && <li className={`${styles.listItem} ${styles.loadMessage}`} key={0}>Loading...</li>}
          {!hasMore && <li className={`${styles.listItem} ${styles.loadMessage}`} key='no-more-events-to-load'>No more incidents to display.</li>}
        </InfiniteScroll>
      </div>
      <br />
      <Button type='button' onClick={onClickAddNewIncident}>Add to new incident</Button>
    </Body>
    <Footer>
      <Button type='button' variant='secondary' onClick={hideModal}>Cancel</Button>
    </Footer>
  </Fragment>;
};

const mapStateToProps = (state) => ({
  incidents: getFeedIncidents(state),
});

export default connect(mapStateToProps, { removeModal, fetchIncidentFeed: (...args) => fetchIncidentFeed(...args), fetchNextIncidentFeedPage: (...args) => fetchNextIncidentFeedPage(...args), })(memo(AddToIncidentModal));

AddToIncidentModal.propTypes = {
  onAddToExistingIncident: PropTypes.func.isRequired,
  onAddToNewIncident: PropTypes.func.isRequired,
};