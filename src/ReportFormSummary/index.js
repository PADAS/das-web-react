import React, { memo, useEffect } from 'react';
import MoonLoader from 'react-spinners/MoonLoader';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { fetchEventTypeSchema } from '../ducks/event-schemas';
import { selectEventSchema } from '../selectors/event-schemas';
import { selectEventTypeByValue } from '../selectors/event-types';
import useReport from '../hooks/useReport';

import V1SchemaFormSummary from './V1SchemaFormSummary';
import V2SchemaFormSummary from './V2SchemaFormSummary';

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
    <div className={styles.nonSchemaFields}>
      <div className={styles.nonSchemaField}>
        <label>
          {t('reportTypeLabel')}
        </label>

        {eventTypeTitle}
      </div>

      {report.reported_by?.name && <div className={styles.nonSchemaField}>
        <label>
          {t('reportedByLabel')}
        </label>
        {report.reported_by?.name}
      </div>}
    </div>

    {eventType.version === 1 && <V1SchemaFormSummary eventSchema={eventSchema} report={report} />}

    {eventType.version === 2 && <V2SchemaFormSummary
      eventSchema={eventSchema}
      formData={report?.event_details || {}}
    />}
  </div>;
};

export default memo(EventFormSummary);
