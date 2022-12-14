import React, { memo, useCallback, useEffect, useMemo } from 'react';
import Collapse from 'react-bootstrap/Collapse';
import { customizeValidator } from '@rjsf/validator-ajv6';
import Form from '@rjsf/bootstrap-4';
import metaSchemaDraft04 from 'ajv/lib/refs/json-schema-draft-04.json';
import PropTypes from 'prop-types';
import { ResizeSpinLoader } from 'react-css-loaders';
import { useDispatch, useSelector } from 'react-redux';

import { ReactComponent as ArrowDownSimpleIcon } from '../../../common/images/icons/arrow-down-simple.svg';
import { ReactComponent as ArrowIntoIcon } from '../../../common/images/icons/arrow-into.svg';
import { ReactComponent as ArrowUpSimpleIcon } from '../../../common/images/icons/arrow-up-simple.svg';

import { fetchEvent } from '../../../ducks/events';
import { fetchEventTypeSchema } from '../../../ducks/event-schemas';
import { getSchemasForEventTypeByEventId } from '../../../utils/event-schemas';
import { TAB_KEYS } from '../../../constants';
import useNavigate from '../../../hooks/useNavigate';
import useReport from '../../../hooks/useReport';

import {
  AddButton,
  ArrayFieldItemTemplate,
  ArrayFieldTemplate,
  BaseInputTemplate,
  ExternalLinkField,
  MoveDownButton,
  MoveUpButton,
  ObjectFieldTemplate,
  RemoveButton,
} from '../../../SchemaFields';
import DateTime from '../../../DateTime';
import EventIcon from '../../../EventIcon';
import ItemActionButton from '../ItemActionButton';

import activitySectionStyles from '../styles.module.scss';
import styles from './styles.module.scss';

const formValidator = customizeValidator({ additionalMetaSchemas: [metaSchemaDraft04] });

const LOADER_COLOR = '#006cd9'; // Bright blue
const LOADER_SIZE = 4;

const ReportListItem = ({ cardsExpanded, onCollapse, onExpand, report }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { displayPriority, displayTitle, eventTypeTitle } = useReport(report);

  const eventSchemas = useSelector((state) => state.data.eventSchemas);
  const reportFromEventStore = useSelector((state) => state.data.eventStore[report.id]);

  const isOpen = useMemo(() => cardsExpanded.includes(report), [cardsExpanded, report]);

  const reportSchemas = reportFromEventStore
    ? getSchemasForEventTypeByEventId(eventSchemas, reportFromEventStore.event_type, reportFromEventStore.id)
    : null;

  const onClickArrowIntoIcon = useCallback(() => navigate(`/${TAB_KEYS.REPORTS}/${report.id}`), [navigate, report]);

  useEffect(() => {
    if (!reportFromEventStore) {
      dispatch(fetchEvent(report.id));
    }
  }, [dispatch, report.id, reportFromEventStore]);

  useEffect(() => {
    if (!reportSchemas) {
      dispatch(fetchEventTypeSchema(report.event_type, report.id));
    }
  }, [dispatch, report.event_type, report.id, reportSchemas]);

  return <li>
    <div
      className={`${activitySectionStyles.itemRow} ${activitySectionStyles.collapseRow}`}
      onClick={isOpen ? onCollapse: onExpand}
    >
      <div className={`${activitySectionStyles.itemIcon} ${activitySectionStyles[`priority-${displayPriority}`]}`}>
        <EventIcon report={report} />
      </div>

      <div className={activitySectionStyles.itemDetails}>
        <div className={activitySectionStyles.reportDetail}>
          <p className={activitySectionStyles.serialNumber}>{report.serial_number}</p>

          <p className={activitySectionStyles.itemTitle} >
            {displayTitle}
          </p>
        </div>

        <DateTime
          className={activitySectionStyles.itemDate}
          date={report.time}
          showElapsed={false}
        />
      </div>

      <div className={activitySectionStyles.itemActionButtonContainer}>
        {!!reportFromEventStore && <ItemActionButton onClick={onClickArrowIntoIcon} tooltip="Go to report">
          <ArrowIntoIcon />
        </ItemActionButton>}
      </div>

      <div className={activitySectionStyles.itemActionButtonContainer}>
        <ItemActionButton>
          {isOpen
            ? <ArrowUpSimpleIcon />
            : <ArrowDownSimpleIcon />}
        </ItemActionButton>
      </div>
    </div>

    <Collapse
      className={`${styles.collapse} ${activitySectionStyles.collapse}`}
      data-testid={`reportManager-activitySection-collapse-${report.id}`}
      in={isOpen}
    >
      {!!reportFromEventStore
        ? <div>
          <div className={styles.nonSchemaFields}>
            <div className={styles.nonSchemaField}>
              <label>
                Report Type
              </label>

              {eventTypeTitle}
            </div>

            <div className={styles.nonSchemaField}>
              <label>
                Reported By
              </label>

              {reportFromEventStore.reported_by?.name}
            </div>
          </div>

          {reportSchemas?.schema && <Form
            className={styles.form}
            disabled
            fields={{ externalLink: ExternalLinkField }}
            formData={reportFromEventStore.event_details}
            schema={reportSchemas?.schema}
            showErrorList={false}
            templates={{
              ArrayFieldItemTemplate,
              ArrayFieldTemplate,
              BaseInputTemplate,
              ButtonTemplates: { AddButton, MoveDownButton, MoveUpButton, RemoveButton },
              ObjectFieldTemplate,
            }}
            uiSchema={reportSchemas?.uiSchema}
            validator={formValidator}
          />}
        </div>
        : <ResizeSpinLoader color={LOADER_COLOR} size={LOADER_SIZE} />}
    </Collapse>
  </li>;
};

ReportListItem.propTypes = {
  cardsExpanded: PropTypes.array.isRequired,
  onCollapse: PropTypes.func.isRequired,
  onExpand: PropTypes.func.isRequired,
  report: PropTypes.object.isRequired,
};

export default memo(ReportListItem);
