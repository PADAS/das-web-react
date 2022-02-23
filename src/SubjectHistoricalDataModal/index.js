import React, { useEffect, useCallback, useState, memo } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import Modal from 'react-bootstrap/Modal';
import Table from 'react-bootstrap/Table';
import Pagination from 'react-bootstrap/Pagination';
import tail from 'lodash/tail';

import { fetchObservationsForSubject } from '../ducks/observations';
import { removeModal } from '../ducks/modals';
import LoadingOverlay from '../LoadingOverlay';
import DateTime from '../DateTime';

import styles from './styles.module.scss';

const { Header, Title, Body } = Modal;

const ITEMS_PER_PAGE = 2;
const DISPLAYED_PAGES_LIMIT = 5;

const SubjectHistoricalDataModal = ({ title, subjectId, fetchObservationsForSubject }) => {
  const [loading, setLoadState] = useState(true);
  const [subjectObservations, setSubjectObservations] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchObservations = useCallback((page = 1) => {
    setLoadState(true);
    fetchObservationsForSubject(subjectId, { page: page, page_size: ITEMS_PER_PAGE })
      .then((data) => {
        setSubjectObservations(data.results);
        setTotalPages(Math.ceil(data.count / ITEMS_PER_PAGE));
        setLoadState(false);
      });
  }, [fetchObservationsForSubject, subjectId]);

  useEffect(() => {
    if (currentPage === 1) fetchObservations();
  }, [currentPage, fetchObservations, subjectId]);

  const onPageClick = useCallback(async (page) => {
    fetchObservations(page);
    setCurrentPage(page);
  }, [fetchObservations]);

  return <>
    <Header closeButton>
      <Title>{title}</Title>
    </Header>
    <Body className={styles.modalBody}>
      {loading &&<LoadingOverlay />}
      <Table bordered hover responsive size="sm">
        <thead>
          <tr>
            <th>Date</th>
            <th>Properties</th>
          </tr>
        </thead>
        <tbody>
          {subjectObservations.map(({ id, recorded_at, observation_details }) =>
            <tr key={id}>
              <td><DateTime className={styles.dateTime} date={recorded_at}/></td>
              <td>
                <Table className={styles.detailsTable} borderless responsive size="sm">
                  <tbody>
                    <tr>
                      {Object.keys(observation_details).map(observationKey =>
                        <td key={`${id}-${observationKey}`}>{`${observationKey}: ${observation_details[observationKey]}`}</td>
                        )}
                    </tr>
                  </tbody>
                </Table>
              </td>
            </tr>
            )}
        </tbody>
      </Table>
      <Pagination size="sm">
        {totalPages > DISPLAYED_PAGES_LIMIT && currentPage > 1 && <Pagination.Prev onClick={() => onPageClick(currentPage - 1)}/>}
        {tail(Array.from(Array(totalPages + 1).keys())).map((number) =>
          <Pagination.Item key={number} active={number === currentPage} onClick={() => onPageClick(number)}>
            {number}
          </Pagination.Item>)}
        {totalPages > DISPLAYED_PAGES_LIMIT && <Pagination.Ellipsis />}
        {totalPages > DISPLAYED_PAGES_LIMIT && <Pagination.Item active={totalPages === currentPage} onClick={() => onPageClick(totalPages)}>
          {totalPages}
        </Pagination.Item>}
        {totalPages > DISPLAYED_PAGES_LIMIT && totalPages > currentPage && <Pagination.Next onClick={() => onPageClick(currentPage + 1)}/>}
      </Pagination>
    </Body>
  </>;
};

SubjectHistoricalDataModal.propTypes = {
  title: PropTypes.string.isRequired,
};


export default connect(null, { fetchObservationsForSubject, removeModal })(memo(SubjectHistoricalDataModal));