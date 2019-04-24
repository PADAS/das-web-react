import React, { memo } from 'react';
import PropTypes from 'prop-types';

const LocationJumpButton = memo((props) => {
  const { onJumpClick, map } = props;
  const onButtonClick = () => onJumpClick(coordinates);

  return <button title="Jump to this item's location" type="button" className={styles.jump} onClick={onButtonClick}></button>
});

export default LocationJumpButton;

LocationJumpButton.propTypes = {
  coordinates: PropTypes.arrayOf(PropTypes.number).isRequired,
  map: PropTypes.func.isRequired,
};