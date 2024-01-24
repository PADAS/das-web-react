import React, { memo, useEffect, useRef, useState } from 'react';
import Button from 'react-bootstrap/Button';
import { findDOMNode } from 'react-dom';
import InfiniteScroll from 'react-infinite-scroller';
import Modal from 'react-bootstrap/Modal';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { ADD_INCIDENT_CATEGORY, trackEventFactory } from '../utils/analytics';
import { calcLocationParamStringForUserLocationCoords } from '../utils/location';
import { fetchIncidentFeed, fetchNextIncidentFeedPage } from '../ducks/events';
import { getFeedIncidents } from '../selectors';
import { removeModal } from '../ducks/modals';

import LoadingOverlay from '../LoadingOverlay';
import ReportListItem from '../ReportListItem';

import styles from './styles.module.scss';

const addIncidentTracker = trackEventFactory(ADD_INCIDENT_CATEGORY);

const AddToIncidentModal = ({ id, onAddToExistingIncident, onAddToNewIncident }) => {
  const dispatch = useDispatch();
  const { t } = useTranslation('reports', { keyPrefix: 'addToIncidentModal' });

  const incidents = useSelector(getFeedIncidents);
  const userLocationCoords = useSelector((state) => state?.view?.userLocation?.coords);

  const scrollRef = useRef(null);

  const [loaded, setLoadedState] = useState(false);

  const onClickAddNewIncident = () => {
    onAddToNewIncident();
    dispatch(removeModal(id));

    addIncidentTracker.track('Click Add to new Incident');
  };

  const onExistingIncidentClick = (report) => {
    onAddToExistingIncident(report);
    dispatch(removeModal(id));

    addIncidentTracker.track('Click Add to Existing Incident');
  };

  const onScroll = () => {
    if (incidents.next) {
      dispatch(fetchNextIncidentFeedPage(incidents.next));
    }
  };

  useEffect(() => {
    const fetchFeed = async () => {
      let paramString = 'is_collection=true&include_related_events=true&include_notes=true';
      if (userLocationCoords) {
        paramString += `&location=${calcLocationParamStringForUserLocationCoords(userLocationCoords)}`;
      }

      await dispatch(fetchIncidentFeed({}, paramString));

      setLoadedState(true);
    };

    fetchFeed();
  }, [dispatch, userLocationCoords]);

  const hasMore = !loaded || !!incidents.next;
  return <>
    <Modal.Header>
      <Modal.Title>{t('modalTitle')}</Modal.Title>
    </Modal.Header>

    <Modal.Body>
      {!loaded && <LoadingOverlay />}

      <div ref={scrollRef} className={styles.incidentScrollList}>
        <InfiniteScroll
          element="ul"
          getScrollParent={() => findDOMNode(scrollRef.current)} // eslint-disable-line react/no-find-dom-node
          hasMore={hasMore}
          loadMore={onScroll}
          useWindow={false}
        >
          {incidents.results.map((report, index) =>
            <ReportListItem
              className={styles.listItem}
              key={`${report.id}-${index}`}
              onIconClick={onExistingIncidentClick}
              onTitleClick={onExistingIncidentClick}
              report={report}
              showJumpButton={false}
            />
          )}

          {hasMore
            ? <li className={`${styles.listItem} ${styles.loadMessage}`} key={0}>{t('modalBody.loadingItem')}</li>
            : <li className={`${styles.listItem} ${styles.loadMessage}`} key="no-more-events-to-load">
              {t('modalBody.noMoreEventsItem')}
            </li>}
        </InfiniteScroll>
      </div>

      <br />

      <Button onClick={onClickAddNewIncident} type="button">{t('modalBody.addToNewIncidentButton')}</Button>
    </Modal.Body>

    <Modal.Footer>
      <Button onClick={() => dispatch(removeModal(id))} type="button" variant="secondary">
        {t('modalFooter.cancelButton')}
      </Button>
    </Modal.Footer>
  </>;
};

AddToIncidentModal.propTypes = {
  id: PropTypes.string.isRequired,
  onAddToExistingIncident: PropTypes.func.isRequired,
  onAddToNewIncident: PropTypes.func.isRequired,
};

export default memo(AddToIncidentModal);
