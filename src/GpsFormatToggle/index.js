import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import { updateUserPreferences } from '../ducks/user-preferences';
import { calcGpsDisplayString, GPS_FORMATS } from '../utils/location';

import styles from './styles.module.scss';


const gpsFormats = Object.values(GPS_FORMATS);

class GpsFormatToggle extends PureComponent {
  onFormatChange(format) {
    this.props.updateUserPreferences({
      gpsFormat: format,
    });
  }
  renderGpsDisplayString() {
    const { lat, lng, userPreferences: { gpsFormat } } = this.props;
    return <span className={styles.value}>{calcGpsDisplayString(lat, lng, gpsFormat)}</span>
  }
  renderFormatSelections() {
    const { userPreferences: { gpsFormat }, ...rest } = this.props;
    return (
      <ul className={styles.choices}>
        {gpsFormats.map(format =>
          <li key={format} className={format === gpsFormat ? styles.active : ''} onClick={() => this.onFormatChange(format)}>{format}</li>
        )}
      </ul>
    )
  }
  render() {
    const { userPreferences, updateUserPreferences, lat, lng, onFormatChange, ...rest } = this.props;
    return (
      <div className={styles.container} {...rest}>
        {this.renderFormatSelections()}
        {this.renderGpsDisplayString()}
      </div>
    );
  }
}


GpsFormatToggle.propTypes = {
  lat: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  lng: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
};

const mapStateToProps = ({ view: { userPreferences } }) => ({ userPreferences })

export default connect(mapStateToProps, { updateUserPreferences })(GpsFormatToggle);