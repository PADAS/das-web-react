import React, { memo, useEffect } from 'react';
import MoonLoader from 'react-spinners/MoonLoader';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { fetchEventTypeSchema } from '../ducks/event-schemas';
import { selectEventSchema } from '../selectors/event-schemas';
import { selectEventTypeByValue } from '../selectors/event-types';
import useReport from '../hooks/useReport';

import SchemaFormSummary from '../SchemaFormSummary';
import V1SchemaFormSummary from './V1SchemaFormSummary';

import * as styles from './styles.module.scss';

const LOADER_COLOR = '#006cd9'; // Bright blue
const LOADER_SIZE = 30;

const EventFormSummary = ({ report }) => {
  const dispatch = useDispatch();
  const { t } = useTranslation('details-view', { keyPrefix: 'reportFormSummary' });

  const eventSchema = useSelector((state) => report
    ? selectEventSchema(state, report.event_type, report.id)
    : null);
  const eventType = useSelector((state) => selectEventTypeByValue(state, report.event_type));

  const { eventTypeTitle } = useReport(report);

  useEffect(() => {
    if (!!eventType && !eventSchema) {
      dispatch(fetchEventTypeSchema(report.event_type, report.id));
    }
  }, [dispatch, eventSchema, eventType, report.event_type, report.id]);

  if (!eventSchema) {
    return <div className={styles.loaderWrapper} data-testid="reportFormSummary-loader">
      <MoonLoader color={LOADER_COLOR} size={LOADER_SIZE} />
    </div>;
  }

  return <div className={styles.reportFormSummary}>
    <dl className={styles.nonSchemaFields}>
      <div className={styles.nonSchemaField}>
        <dt>{t('reportTypeLabel')}</dt>

        <dd>{eventTypeTitle}</dd>
      </div>

      {!!report.reported_by?.name && <div className={styles.nonSchemaField}>
        <dt>{t('reportedByLabel')}</dt>

        <dd>{report.reported_by.name}</dd>
      </div>}
    </dl>

    {eventType.version === 1 && <V1SchemaFormSummary eventSchema={eventSchema} report={report} />}

    {eventType.version === 2 && <SchemaFormSummary
      formData={report?.event_details ?? {}}
      schema={eventSchema}
      sectionClassName={styles.schemaSection}
    />}
  </div>;
};

export default memo(EventFormSummary);
