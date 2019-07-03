import React, { memo, isValidElement } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import styles from './styles.module.scss';
import Popover from 'react-bootstrap/Popover';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';

import { getHeatmapTrackPoints } from '../selectors';

import HeatmapStyleControls from '../HeatmapStyleControls';


const HeatmapLegend = ({ title, pointCount, onClose }) => {

  const titleElement = isValidElement(title) ? title: <h6>{title}</h6>;

  return (
    <div className={styles.legend}>
      <button className={styles.close} onClick={onClose}>close</button>
      {titleElement}
      <div className={styles.gradient}></div>
      <span>{pointCount} total points</span>
      <OverlayTrigger trigger="click" rootClose placement='auto' overlay={
        <Popover className={styles.controlPopover}>
          <HeatmapStyleControls showCancel={false} />
        </Popover>
      }>
        <button type="button" className={styles.gearButton}></button>
      </OverlayTrigger>
    </div>
  );
};

HeatmapLegend.propTypes = {
  title: PropTypes.oneOfType([
    PropTypes.element, PropTypes.node,
  ]),
  onClose: PropTypes.func.isRequired,
};

HeatmapLegend.whyDidYouRender = true;

const mapStateToProps = (state) => ({
  tracksAsPoints: getHeatmapTrackPoints(state),
});

export default connect(mapStateToProps, null)(memo(HeatmapLegend));


/* heatmap state should look like this:
  -- list of contained subjects with each subject's number of points
  -- featureCollection with all points
*/

