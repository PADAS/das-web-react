import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import Button from 'react-bootstrap/Button';
import InfiniteScroll from 'react-infinite-scroller';
import Modal from 'react-bootstrap/Modal';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { ADD_INCIDENT_CATEGORY, trackEventFactory } from '../utils/analytics';
import { calcLocationParamStringForUserLocationCoords } from '../utils/location';
import { fetchIncidentFeed, fetchNextIncidentFeedPage } from '../ducks/events';
import { getFeedIncidents } from '../selectors';
import { removeModal } from '../ducks/modals';

import LoadingOverlay from '../LoadingOverlay';
import ReportListItem from '../ReportListItem';

import * as styles from './styles.module.scss';

const addIncidentTracker = trackEventFactory(ADD_INCIDENT_CATEGORY);

const AddToIncidentModal = ({ id, onAddToExistingIncident, onAddToNewIncident }) => {
  const dispatch = useDispatch();
  const { t } = useTranslation('reports', { keyPrefix: 'addToIncidentModal' });

  const feedIncidents = useSelector(getFeedIncidents);
  const userLocationCoords = useSelector((state) => state?.view?.userLocation?.coords);

  const scrollRef = useRef(null);

  const [loaded, setLoadedState] = useState(false);

  const hasMore = !!feedIncidents.next;

  const onClickAddNewIncident = () => {
    onAddToNewIncident();
    dispatch(removeModal(id));

    addIncidentTracker.track('Click Add to new Incident');
  };

  const onExistingIncidentClick = useCallback((report) => {
    onAddToExistingIncident(report);
    dispatch(removeModal(id));

    addIncidentTracker.track('Click Add to Existing Incident');
  }, [dispatch, id, onAddToExistingIncident]);

  const onScroll = () => {
    if (feedIncidents.next) {
      dispatch(fetchNextIncidentFeedPage(feedIncidents.next));
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

  return <>
    <Modal.Header>
      <Modal.Title>{t('modalTitle')}</Modal.Title>
    </Modal.Header>

    <Modal.Body className={styles.modalBody}>
      {!loaded && <LoadingOverlay />}

      {!!loaded && <div ref={scrollRef} className={styles.incidentScrollList}>
        <InfiniteScroll
          element="ul"
          getScrollParent={() => scrollRef.current}
          hasMore={hasMore}
          loadMore={onScroll}
          useWindow={false}
        >
          {feedIncidents.results.map((report) =>
            <ReportListItem
              key={report.id}
              onIconClick={onExistingIncidentClick}
              onTitleClick={onExistingIncidentClick}
              report={report}
              showJumpButton={false}
            />
          )}

          {hasMore
            ? <li className={styles.listFooterItem} key={0}>{t('modalBody.loadingItem')}</li>
            : <li className={styles.listFooterItem} key="no-more-events-to-load">
              {t('modalBody.noMoreEventsItem')}
            </li>}
        </InfiniteScroll>
      </div>}

      <div className={styles.spacer} />

      <Button onClick={onClickAddNewIncident} type="button">{t('modalBody.addToNewIncidentButton')}</Button>
    </Modal.Body>

    <Modal.Footer>
      <Button onClick={() => dispatch(removeModal(id))} type="button" variant="secondary">
        {t('modalFooter.cancelButton')}
      </Button>
    </Modal.Footer>
  </>;
};

export default memo(AddToIncidentModal);
