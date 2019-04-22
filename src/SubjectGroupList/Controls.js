import React from 'react';
import PropTypes from 'prop-types';
import HeatmapToggleButton from '../HeatmapToggleButton';
import TrackToggleButton from '../TrackToggleButton';

const Controls = (props) => {
  const  { showHeatmapButton, showTrackButton, onTrackToggle, onHeatmapToggle, ...rest } = props;
  if (!showHeatmapButton && !showTrackButton) return null;
  return <div {...rest}>
    {showHeatmapButton && <HeatmapToggleButton showLabel={false} heatmapVisible={false} onButtonClick={() => console.log('heatmap click')} subjectId='2' />}
    {showTrackButton && <TrackToggleButton showLabel={false} trackVisible={true} trackPinned={false} onButtonClick={() => console.log('track click')} trackId='2' />}
  </div>
};

Controls.defaultProps = {
  showHeatmapButton: true,
  showTrackButton: false,
};

Controls.propTypes = {
  showHeatmapButton: PropTypes.bool,
  showTrackButton: PropTypes.bool,
  onHeatmapToggle: PropTypes.func,
  onTrackToggle: PropTypes.func,
}

export default Controls;