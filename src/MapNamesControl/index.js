import React from 'react';
import ReactGA from 'react-ga';
import { connect } from 'react-redux';
import { toggleMapNameState } from '../ducks/map-ui';
import styles from './styles.module.scss';

const MapNamesControl = (props) => {

  const { showMapNames, toggleMapNameState } = props;

  const handleChange = (e) => {
    toggleMapNameState(!showMapNames);

    ReactGA.event({
      category: 'Map Interaction',
      action: 'Click',
      label: 'Show Names:' + (!mapIsLocked).toString(),
    });
  };

  return <label>
    <input type='checkbox' id='mapname' name='mapname' checked={showMapNames} onChange={handleChange}/>
    <span className={styles.cbxlabel}>Show Names </span>
  </label>;
};

const mapStateToProps = ( {view:{showMapNames}} ) => {
  return {showMapNames};
};

export default connect(mapStateToProps, {toggleMapNameState})(MapNamesControl);