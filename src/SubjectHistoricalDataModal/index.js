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
const ELLIPSIS_PAGE_ITEM = '...';

const SubjectHistoricalDataModal = ({ title, subjectId, fetchObservationsForSubject }) => {
  const [loading, setLoadState] = useState(true);
  const [subjectObservations, setSubjectObservations] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageItems, setPageItems] = useState([]);

  const getPages = useCallback(() => {
    const pagesArray = tail(Array.from(Array(totalPages + 1).keys()));
    console.log('%c pagesArray', 'font-size:20px;color:red;', pagesArray);
    if (totalPages < DISPLAYED_PAGES_LIMIT) return pagesArray;

    const halfOfDisplayedPages = Math.floor(DISPLAYED_PAGES_LIMIT / 2);
    const halfOfTotalPages = Math.floor(totalPages / 2);

    if (halfOfTotalPages <= halfOfDisplayedPages) return pagesArray;
    console.log('%c pageItems ARRAY', 'font-size:20px;color:red;', [...pagesArray.slice(0, halfOfDisplayedPages), ...[ELLIPSIS_PAGE_ITEM], ...pagesArray.slice(-halfOfDisplayedPages, totalPages)]);
    return [...pagesArray.slice(0, halfOfDisplayedPages), ...[ELLIPSIS_PAGE_ITEM], ...pagesArray.slice(-halfOfDisplayedPages, totalPages)];
  }, [totalPages]);

  const fetchObservations = useCallback((page = 1) => {
    setLoadState(true);
    fetchObservationsForSubject(subjectId, { page: page, page_size: ITEMS_PER_PAGE })
      .then((data) => {
        setSubjectObservations(data.results);
        setTotalPages(Math.ceil(data.count / ITEMS_PER_PAGE));
        setLoadState(false);
        const pages = getPages();
        setPageItems(pages);
        console.log('%c pageItems', 'font-size:20px;color:green;', getPages());
      });
  }, [fetchObservationsForSubject, getPages, subjectId]);

  useEffect(() => {
    if (currentPage === 1) fetchObservations();
  }, [currentPage, fetchObservations, subjectId]);

  const onPageClick = useCallback((page) => {
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
        {pageItems.map((item) => {
          return (item === ELLIPSIS_PAGE_ITEM) ? <Pagination.Ellipsis key={item} /> : <Pagination.Item key={item} active={item === currentPage} onClick={() => onPageClick(item)}>{item}</Pagination.Item>;
        }
          // <Pagination.Item key={item} active={item === currentPage} onClick={() => onPageClick(item)}>{item}</Pagination.Item>
        )}
        {totalPages > DISPLAYED_PAGES_LIMIT && totalPages > currentPage && <Pagination.Next onClick={() => onPageClick(currentPage + 1)}/>}
      </Pagination>
    </Body>
  </>;
};

SubjectHistoricalDataModal.propTypes = {
  title: PropTypes.string.isRequired,
};


export default connect(null, { fetchObservationsForSubject, removeModal })(memo(SubjectHistoricalDataModal));