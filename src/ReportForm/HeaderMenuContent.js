
import React, { forwardRef, memo, useCallback } from 'react';
import Button from 'react-bootstrap/Button';
import Popover from 'react-bootstrap/Popover';
import PropTypes from 'prop-types';

import { ReactComponent as IncidentIcon } from '../common/images/icons/incident.svg';
import { ReactComponent as ExternalLinkIcon } from '../common/images/icons/external-link.svg';

import { withFormDataContext } from '../EditableItem/context';

import DasIcon from '../DasIcon';
import PriorityPicker from '../PriorityPicker';

import styles from './styles.module.scss';

const ReportHeaderPopover = ({
  data,
  onPrioritySelect,
  onStartAddToIncident,
  onStartAddToPatrol,
  isPatrolReport,
  ...rest
}, ref) => {
  const eventOrIncidentReport = `${data.is_collection? 'Incident' : 'Event'} Report`;

  const linkToReport = useCallback(() => {
    try {
      const url = data.external_source.url;
      window.open(url, '_blank');
    } catch (e) {
      console.log('error occured while opening external data', e);
    }
  }, [data]);

  const reportBelongsToCollection = !!data?.is_contained_in?.length;
  const canAddToIncident = !data.is_collection && !reportBelongsToCollection;
  const hasExternalLink = (!!data.external_source && !!data.external_source.url);

  return <Popover {...rest} ref={ref} className={styles.headerPopover}>
    <Popover.Header>{eventOrIncidentReport}</Popover.Header>

    <Popover.Body>
      <h6>Priority:</h6>

      <PriorityPicker selected={data.priority} onSelect={onPrioritySelect} />

      {canAddToIncident && <>
        <hr />
        <Button className={styles.addToIncidentBtn} variant='link' onClick={onStartAddToIncident}>
          <IncidentIcon style={{ height: '2rem', width: '2rem' }} />Add to Incident
        </Button>
      </>}

      {!isPatrolReport && <Button className={styles.addToIncidentBtn} variant='link' onClick={onStartAddToPatrol}>
        <DasIcon type='events' iconId='routine-patrol-icon' color='gray' className={styles.patrolIcon} />
        Add to Patrol
      </Button>}

      {hasExternalLink && <>
        <hr />
        <Button className={styles.addToIncidentBtn} variant='secondary' onClick={linkToReport}>
          <img src={data.external_source.icon_url} style={{ height: '2rem', width: '2rem' }} alt={data.external_source.text} /> {data.external_source.text}
          <ExternalLinkIcon style={{ height: '1rem', width: '1rem', marginLeft: '0.1rem' }} />
        </Button>
      </>}
    </Popover.Body>
  </Popover>;
};

ReportHeaderPopover.defaultProps = {
  isPatrolReport: false,
};

ReportHeaderPopover.propTypes = {
  data: PropTypes.object.isRequired,
  onPrioritySelect: PropTypes.func.isRequired,
  onStartAddToIncident: PropTypes.func.isRequired,
};

export default memo(withFormDataContext(forwardRef(ReportHeaderPopover)));
