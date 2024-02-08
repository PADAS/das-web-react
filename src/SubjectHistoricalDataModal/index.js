import React, { memo, useEffect, useState } from 'react';
import flatten from 'lodash/flatten';
import Modal from 'react-bootstrap/Modal';
import Pagination from 'react-js-pagination';
import PropTypes from 'prop-types';
import startCase from 'lodash/startCase';
import Table from 'react-bootstrap/Table';
import unionBy from 'lodash/unionBy';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { calcGpsDisplayString } from '../utils/location';
import { fetchObservationsForSubject } from '../ducks/observations';

import DateTime from '../DateTime';
import LoadingOverlay from '../LoadingOverlay';

import styles from './styles.module.scss';

export const DISPLAYED_PAGES_LIMIT = 5;
export const ITEMS_PER_PAGE = 10;
export const SORT_BY = '-recorded_at';

export const getObservationUniqProperties = (observations) => {
  const observationsDeviceProperties = observations.map((result) => result?.device_status_properties ?? []);
  const uniqPropertiesByLabel = unionBy(flatten(observationsDeviceProperties), 'label');
  return uniqPropertiesByLabel.map((property) => property.label);
};

const ObservationRow = ({ observation, observationProperties, subjectIsStatic }) => {
  const { t } = useTranslation('subjects', { keyPrefix: 'subjectHistoricalDataModal.observationRow' });

  const gpsFormat = useSelector((state) => state.view.userPreferences.gpsFormat);

  const locationString = !subjectIsStatic
    && calcGpsDisplayString(observation.location.latitude, observation.location.longitude, gpsFormat);

  return <tr>
    <td>
      <DateTime className={styles.dateTime} date={observation.recorded_at}/>
    </td>

    {observationProperties.map((property) => {
      const matchedProp = observation.device_status_properties?.find((observationProperty) => observationProperty.label === property);
      if (!matchedProp) {
        return <span className={styles.noDataLabel} key={property}>{t('noDataLabel')}</span>;
      }

      const propertyUnitsLabel = JSON.parse(JSON.stringify(matchedProp.units)) ? ` ${matchedProp.units}` : '';

      return <td key={property}>
        <span className={styles.propertyValue}>{`${matchedProp.value}${propertyUnitsLabel}`}</span>
      </td>;
    })}

    {!!locationString && <td>{locationString}</td>}
  </tr>;
};

const SubjectHistoricalDataModal = ({ subjectId, subjectIsStatic, title }) => {
  const dispatch = useDispatch();
  const { t } = useTranslation('subjects', { keyPrefix: 'subjectHistoricalDataModal' });

  const [activePage, setActivePage] = useState(1);
  const [loading, setLoadState] = useState(true);
  const [observationsCount, setObservationsCount] = useState(1);
  const [observationProperties, setObservationProperties] = useState([]);
  const [subjectObservations, setSubjectObservations] = useState([]);

  useEffect(() => {
    setLoadState(true);

    dispatch(fetchObservationsForSubject({
      subject_id: subjectId,
      page: activePage,
      page_size: ITEMS_PER_PAGE,
      sort_by: SORT_BY,
    })).then((data) => {
      setSubjectObservations(data.results);
      setObservationsCount(data.count);
      setLoadState(false);
      setObservationProperties(getObservationUniqProperties(data.results));
    });
  }, [activePage, dispatch, subjectId]);

  return <>
    <Modal.Header closeButton>
      <Modal.Title>{title}</Modal.Title>
    </Modal.Header>

    <Modal.Body className={styles.modalBody}>
      {loading && <LoadingOverlay/>}

      <Table bordered hover responsive size="sm">
        <thead>
          <tr>
            <th>{t('tableDateHeader')}</th>

            {observationProperties.map((property) => <th key={property}>{startCase(property)}</th>)}

            {!subjectIsStatic && <th>{t('tableLocationHeader')}</th>}
          </tr>
        </thead>

        <tbody>
          {subjectObservations.map((observation) => <ObservationRow
            key={observation.id}
            observation={observation}
            observationProperties={observationProperties}
            subjectIsStatic={subjectIsStatic}
          />)}
        </tbody>
      </Table>

      {observationsCount > ITEMS_PER_PAGE && <Pagination
        activePage={activePage}
        itemClass="page-item"
        itemsCountPerPage={ITEMS_PER_PAGE}
        linkClass="page-link"
        onChange={(page) => setActivePage(page)}
        pageRangeDisplayed={DISPLAYED_PAGES_LIMIT}
        totalItemsCount={observationsCount}
      />}
    </Modal.Body>
  </>;
};

SubjectHistoricalDataModal.propTypes = {
  subjectId: PropTypes.string.isRequired,
  subjectIsStatic: PropTypes.bool.isRequired,
  title: PropTypes.string.isRequired,
};

export default memo(SubjectHistoricalDataModal);
