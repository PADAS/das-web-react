import React, { memo, useEffect, useId, useState } from 'react';
import flatten from 'lodash/flatten';
import Modal from 'react-bootstrap/Modal';
import startCase from 'lodash/startCase';
import Pagination from 'react-bootstrap/Pagination';
import Table from 'react-bootstrap/Table';
import unionBy from 'lodash/unionBy';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { fetchObservationsForSubject } from '../ducks/observations';
import { selectCoordinatesRepresentation } from '../selectors/location';
import useStringifyCoordinates from '../hooks/useStringifyCoordinates';

import DateTime from '../DateTime';
import IconTooltip from '../IconTooltip';
import LoadingOverlay from '../LoadingOverlay';

import * as styles from './styles.module.scss';

export const DISPLAYED_PAGE_ITEMS_COUNT = 5;
export const ITEMS_PER_PAGE = 10;
export const SORT_BY = '-recorded_at';

export const getObservationUniqProperties = (observations) => {
  const observationsDeviceProperties = observations.map((result) => result?.device_status_properties ?? []);
  const uniqPropertiesByLabel = unionBy(flatten(observationsDeviceProperties), 'label');
  return uniqPropertiesByLabel.map((property) => property.label);
};

const getPageItemNumbers = (pagesCount, activePage) => {
  let start = 1;
  let end = DISPLAYED_PAGE_ITEMS_COUNT;
  if (pagesCount > DISPLAYED_PAGE_ITEMS_COUNT) {
    const halfDisplayedPageItemsCount = Math.floor(DISPLAYED_PAGE_ITEMS_COUNT / 2);
    start = activePage - halfDisplayedPageItemsCount;
    end = activePage + halfDisplayedPageItemsCount;

    if (start < 1) {
      start = 1;
      end = DISPLAYED_PAGE_ITEMS_COUNT;
    } else if (end > pagesCount) {
      start = pagesCount - DISPLAYED_PAGE_ITEMS_COUNT + 1;
      end = pagesCount;
    }
  }

  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
};

const ObservationRow = ({ observation, observationProperties, subjectIsStatic }) => {
  const { t } = useTranslation('subjects', { keyPrefix: 'subjectHistoricalDataModal.observationRow' });

  const coordinatesRepresentation = useSelector(selectCoordinatesRepresentation);

  const observationOutsideBboxTooltipId = useId();

  const {
    coordinatesString: observationCoordinatesString,
    outsideRepresentationBbox: observationOutsideRepresentationBbox,
  } = useStringifyCoordinates(observation.location);

  return <tr>
    <td>
      <DateTime className={styles.dateTime} date={observation.recorded_at} />
    </td>

    {observationProperties.map((property) => {
      const matchedProp = observation.device_status_properties?.find((observationProperty) => observationProperty.label === property);
      if (!matchedProp) {
        return <td key={property}>
          <span className={styles.noDataLabel} key={property}>{t('noDataLabel')}</span>
        </td>;
      }

      const propertyUnitsLabel = JSON.parse(JSON.stringify(matchedProp.units)) ? ` ${matchedProp.units}` : '';

      return <td key={property}>
        <span className={styles.propertyValue}>{`${matchedProp.value}${propertyUnitsLabel}`}</span>
      </td>;
    })}

    {!subjectIsStatic && observationCoordinatesString && <td>
      <div className={styles.observationCoordinates}>
        <span aria-describedby={observationOutsideBboxTooltipId}>{observationCoordinatesString}</span>

        {observationOutsideRepresentationBbox && <IconTooltip
          aria-label={t('observationOutsideBboxTooltipButtonLabel')}
          id={observationOutsideBboxTooltipId}
          title={t('observationOutsideBboxTooltipTitle', {
            crsName: coordinatesRepresentation.name,
            epsgCode: coordinatesRepresentation.code,
          })}
        />}
      </div>
    </td>}
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

  const pagesCount = Math.ceil(observationsCount / ITEMS_PER_PAGE);
  const pageItemNumbers = getPageItemNumbers(pagesCount, activePage);

  return <>
    <Modal.Header closeButton>
      <Modal.Title>{title}</Modal.Title>
    </Modal.Header>

    <Modal.Body className={styles.modalBody}>
      {loading && <LoadingOverlay />}

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

      {observationsCount > ITEMS_PER_PAGE && <Pagination>
        <Pagination.First disabled={activePage === 1} onClick={() => setActivePage(1)} />

        <Pagination.Prev disabled={activePage === 1} onClick={() => setActivePage(activePage - 1)} />

        {pageItemNumbers.map((pageItemNumber) => <Pagination.Item
          active={pageItemNumber === activePage}
          key={pageItemNumber}
          onClick={() => setActivePage(pageItemNumber)}
        >
          {pageItemNumber}
        </Pagination.Item>)}

        <Pagination.Next disabled={activePage === pagesCount} onClick={() => setActivePage(activePage + 1)} />

        <Pagination.Last disabled={activePage === pagesCount} onClick={() => setActivePage(pagesCount)} />
      </Pagination>}
    </Modal.Body>
  </>;
};

export default memo(SubjectHistoricalDataModal);
