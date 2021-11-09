import React, { memo, useRef, useEffect, useState, useReducer, useMemo, useCallback, useContext } from 'react';
import axios from 'axios';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { findDOMNode } from 'react-dom';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import InfiniteScroll from 'react-infinite-scroller';
import uniq from 'lodash/uniq';


import { removeModal } from '../ducks/modals';
import { trackEvent } from '../utils/analytics';
import { patrolStateAllowsTrackDisplay } from '../utils/patrols';
import { calcPatrolFilterForRequest } from '../utils/patrol-filter';

import LoadingOverlay from '../LoadingOverlay';
import PatrolListItem from '../PatrolListItem';

import { INITIAL_PATROLS_STATE, PATROLS_API_URL, updatePatrolStore } from '../ducks/patrols';

import { SocketContext } from '../withSocketConnection';


import styles from './styles.module.scss';

const { Header, Title, Body, Footer } = Modal;

const { get } = axios;

const FETCH_FEED_SUCCESS = 'FETCH_FEED_SUCCESS';
const FEED_FETCH_NEXT_PAGE_SUCCESS = 'FEED_FETCH_NEXT_PAGE_SUCCESS';
const FEED_REALTIME_UPDATE = 'FEED_REALTIME_UPDATE';

const fetchFeedSuccess = (payload) => ({
  type: FETCH_FEED_SUCCESS,
  payload,
});

const fetchFeedNextPageSuccess = (payload) => ({
  type: FEED_FETCH_NEXT_PAGE_SUCCESS,
  payload,
});

const socketPatrolUpdate = (id) => ({
  type: FEED_REALTIME_UPDATE,
  payload: id,
});

const activePatrolsFeedRecuer = (state, action) => {
  const { type, payload } = action;
  if (type === FETCH_FEED_SUCCESS) {
    return {
      ...payload,
      results: payload.results.map(patrol => patrol.id),
    };
  }
  if (type === FEED_FETCH_NEXT_PAGE_SUCCESS) {
    const { results: patrols, count, next, previous } = payload;

    const patrolIds = patrols.map(({ id }) => id);

    return {
      ...state,
      count,
      next,
      previous,
      results: uniq([...state.results, ...patrolIds]),
    };
  }
  if (type === FEED_REALTIME_UPDATE) {
    return {
      ...state,
      results: uniq([payload, ...state.results]),
    };
  }
  return state;
};

const AddToPatrolModal = (props) => {
  const { id, removeModal, onAddToPatrol, updatePatrolStore, patrolStore,
  } = props;

  const scrollRef = useRef(null);
  const [loaded, setLoadedState] = useState(false);
  const [patrols, dispatch] = useReducer(activePatrolsFeedRecuer, INITIAL_PATROLS_STATE);

  const listPatrols = useMemo(() => patrols.results
    .map(p => patrolStore[p])
    .filter(item => !!item)
    .sort((p1, p2) =>
      (new Date(p2.patrol_segments[0].time_range.start_time).getTime() - new Date(p1.patrol_segments[0].time_range.start_time).getTime())
    ), [patrolStore, patrols.results]);

  const fetchFeedPatrols = useCallback(() => {
    const params = calcPatrolFilterForRequest({ params: { page_size: 75 } });
    return get(`${PATROLS_API_URL}?${params}`)
      .then(({ data: { data: patrols } }) => {
        dispatch(fetchFeedSuccess(patrols));
        setLoadedState(true);
        updatePatrolStore(patrols);
      })
      .catch((error) => {
        console.warn({ error });
      });
  }, [updatePatrolStore]);

  const fetchFeedPatrolsNextPage = useCallback(() => {
    return get(patrols.next)
      .then(({ data: { data: patrols }  }) => {
        dispatch(fetchFeedNextPageSuccess(patrols));
      })
      .catch((error) => {
        console.warn({ error });
      });
  }, [patrols.next]);

  const onPatrolSocketMessage = useCallback(({ patrol_data }) => {
    if (patrolStateAllowsTrackDisplay(patrol_data)) {
      dispatch(socketPatrolUpdate(patrol_data.id));
    }
  }, []);

  const hideModal = () => {
    removeModal(id);
  };

  const socket = useContext(SocketContext);

  useEffect(() => {
    if (socket) {
      socket.on('new_patrol', onPatrolSocketMessage);
      socket.on('update_patrol', onPatrolSocketMessage);

      return () => {
        socket.off('new_patrol', onPatrolSocketMessage);
        socket.off('update_patrol', onPatrolSocketMessage);
      };
    }
  }, [onPatrolSocketMessage, socket]);

  useEffect(() => {
    fetchFeedPatrols();
  }, [fetchFeedPatrols]);

  const onClickPatrol = (patrol) => {
    onAddToPatrol(patrol);
    hideModal();
    trackEvent('Add To Patrol', 'Click Add to Existing Patrol');
  };


  const onScroll = useCallback(() => {
    if (!patrols.next) return null;
    return fetchFeedPatrolsNextPage(patrols.next);
  }, [fetchFeedPatrolsNextPage, patrols.next]);

  const hasMore = !!patrols.next;

  return <>
    <Header>
      <Title>Add to Patrol</Title>
    </Header>
    <Body style={{ minHeight: '10rem' }}>
      {!loaded && <LoadingOverlay data-testid='patrol-feed-loading-overlay' />}
      {!!loaded && <div data-testid='patrol-feed-container'>
        <div ref={scrollRef} className={styles.incidentScrollList}>
          <InfiniteScroll
            element='ul'
            hasMore={hasMore}
            loadMore={onScroll}
            useWindow={false}
            getScrollParent={() => findDOMNode(scrollRef.current)}> {/* eslint-disable-line react/no-find-dom-node */}

            {listPatrols.map((patrol, index) => {

              return <PatrolListItem
                className={styles.listItem}
                patrol={patrol}
                data-testid={`patrol-list-item-${index}`}
                key={`${id}-${index}`}
                showControls={false}
                onTitleClick={onClickPatrol} />;
            })}
            {hasMore && <li className={`${styles.listItem} ${styles.loadMessage}`} key={0}>Loading...</li>}
            {!!loaded && !hasMore && <li className={`${styles.listItem} ${styles.loadMessage}`} style={{ marginTop: '0.5rem' }} key='no-more-events-to-load'>No more patrols to display.</li>}
          </InfiniteScroll>
        </div>
      </div>}
    </Body>
    <Footer>
      <Button type='button' data-testid='close-modal-button' variant='secondary' onClick={hideModal}>Cancel</Button>
    </Footer>
  </>;
};

const mapStateToProps = ({ data: { patrolStore } }) => ({ patrolStore });

export default connect(mapStateToProps, { removeModal: id => removeModal(id), updatePatrolStore: patrols => updatePatrolStore(patrols) })(memo(AddToPatrolModal));

AddToPatrolModal.propTypes = {
  onAddToPatrol: PropTypes.func.isRequired,
};