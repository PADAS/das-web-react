
import React, { Fragment, memo, forwardRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import Popover from 'react-bootstrap/Popover';
import Button from 'react-bootstrap/Button';

import { ReactComponent as AddToIncidentIcon } from '../common/images/icons/add-to-incident.svg';
import { ReactComponent as ExternalLinkIcon } from '../common/images/icons/external-link.svg';
import PriorityPicker from '../PriorityPicker';

import styles from './styles.module.scss';

const ReportHeaderPopover = (props, ref) => {
  const { report, onPrioritySelect, onStartAddToIncident, ...rest } = props;
  const eventOrIncidentReport = `${report.is_collection? 'Incident' : 'Event'} Report`;  

  const linkToReport = useCallback(() => {
    try {
      const url = report.external_source.url;
      window.open(url,'_blank');
    } catch (e) {
      console.log('error occured while opening external report', e);
    }
  }, [report]);

  const reportBelongsToCollection = !!report.is_contained_in && !!report.is_contained_in.length;
  const canAddToIncident = !report.is_collection && !reportBelongsToCollection;
  const hasExternalLink = (!!report.external_source && !!report.external_source.url);

  return <Popover {...rest} ref={ref} className={styles.headerPopover}> {/* eslint-disable-line react/display-name */}
    <Popover.Title>{eventOrIncidentReport}</Popover.Title>
    <Popover.Content>
      <h6>Priority:</h6>
      <PriorityPicker selected={report.priority} onSelect={onPrioritySelect} />
      {canAddToIncident && <Fragment>
        <hr />
        <Button className={styles.addToIncidentBtn} variant='link' onClick={onStartAddToIncident}>
          <AddToIncidentIcon style={{height: '2rem', width: '2rem'}} />Add to incident
        </Button>
      </Fragment>
      }
      {hasExternalLink && <Fragment> 
        <hr />
        <Button className={styles.addToIncidentBtn} variant='secondary' onClick={linkToReport}>
          <img src={report.external_source.icon_url} style={{height: '2rem', width: '2rem'}} alt={report.external_source.text} /> {report.external_source.text}
          <ExternalLinkIcon style={{height: '1rem', width: '1rem', marginLeft: '0.1rem'}} />
        </Button>
      </Fragment>
      }
    </Popover.Content>
  </Popover>;
};

export default memo(forwardRef(ReportHeaderPopover));

ReportHeaderPopover.propTypes = {
  report: PropTypes.object.isRequired,
  onPrioritySelect: PropTypes.func.isRequired,
  onStartAddToIncident: PropTypes.func.isRequired,
};