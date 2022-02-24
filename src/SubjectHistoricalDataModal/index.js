import React, { useEffect, useCallback, useState, memo } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import Modal from 'react-bootstrap/Modal';
import Table from 'react-bootstrap/Table';
import Pagination from 'react-js-pagination';
import unionBy from 'lodash/unionBy';
import flatten from 'lodash/flatten';
import startCase from 'lodash/startCase';

import { fetchObservationsForSubject } from '../ducks/observations';
import { removeModal } from '../ducks/modals';
import LoadingOverlay from '../LoadingOverlay';
import DateTime from '../DateTime';

import styles from './styles.module.scss';

const { Header, Title, Body } = Modal;

const ITEMS_PER_PAGE = 10;
const DISPLAYED_PAGES_LIMIT = 5;

const SubjectHistoricalDataModal = ({ title, subjectId, fetchObservationsForSubject }) => {
  const [loading, setLoadState] = useState(true);
  const [subjectObservations, setSubjectObservations] = useState([]);
  const [observationsCount, setObservationsCount] = useState(1);
  const [observationProperties, setObservationProperties] = useState([]);
  const [activePage, setActivePage] = useState(1);

  const getObservationUniqProperties = useCallback((observations) => {
    const observationsDeviceProperties = observations.map(result => result.device_status_properties);
    const uniqPropertiesByLabel = unionBy(flatten(observationsDeviceProperties), 'label');
    return uniqPropertiesByLabel.map(property => property.label);
  }, []);

  const fetchObservations = useCallback((page = 1) => {
    setLoadState(true);
    fetchObservationsForSubject(subjectId, { page: page, page_size: ITEMS_PER_PAGE })
      .then((data) => {
        setSubjectObservations(data.results);
        setObservationsCount(data.count);
        setLoadState(false);
        setObservationProperties(getObservationUniqProperties(data.results));
      });
  }, [fetchObservationsForSubject, getObservationUniqProperties, subjectId]);

  useEffect(() => {
    if (activePage === 1) fetchObservations();
  }, [activePage, fetchObservations]);

  const onPageClick = useCallback(async (page) => {
    fetchObservations(page);
    setActivePage(page);
  }, [fetchObservations]);

  const getMatchedProperty = useCallback((labelToMatch, observationProperties) => {
    const matchedProp = observationProperties.find(prop =>  prop.label === labelToMatch);
    if (!matchedProp) return 'No data';
    return `${matchedProp.value} ${matchedProp.units}`;
  }, []);

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
            {observationProperties.map(property => <th key={property}>{startCase(property)}</th>)}
          </tr>
        </thead>
        <tbody>
          {subjectObservations.map(({ id, recorded_at, device_status_properties }) =>
            <tr key={id}>
              <td><DateTime className={styles.dateTime} date={recorded_at}/></td>
              {observationProperties.map(property => <td key={property}>{getMatchedProperty(property, device_status_properties)}</td>)}
            </tr>
            )}
        </tbody>
      </Table>
      {observationsCount > ITEMS_PER_PAGE && <Pagination
        activePage={activePage}
        itemsCountPerPage={ITEMS_PER_PAGE}
        totalItemsCount={observationsCount}
        pageRangeDisplayed={DISPLAYED_PAGES_LIMIT}
        onChange={onPageClick}
        linkClass="page-link"
        itemClass="page-item"
      />}
    </Body>
  </>;
};

SubjectHistoricalDataModal.propTypes = {
  title: PropTypes.string.isRequired,
};


export default connect(null, { fetchObservationsForSubject, removeModal })(memo(SubjectHistoricalDataModal));