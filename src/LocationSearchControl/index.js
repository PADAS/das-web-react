import React, { useRef, useState, useEffect, useContext, useCallback, memo, useMemo } from 'react';
import Overlay from 'react-bootstrap/Overlay';
import { connect } from 'react-redux';
import Popover from 'react-bootstrap/Popover';
import GpsInput from '../GpsInput';
import { jumpToLocation } from '../utils/map';
import { ReactComponent as SearchIcon } from '../common/images/icons/search-icon.svg';
import { MapContext } from '../App';
import { showPopup } from '../ducks/popup';
import { calcActualGpsPositionForRawText, validateLngLat } from '../utils/location';
import styles from './styles.module.scss';

const LocationSearch = (props) => {
  const { showPopup, gpsFormat } = props;
  const buttonRef = useRef(null);
  const wrapperRef = useRef(null);
  const [active, setActiveState] = useState(false);
  const [query, setQuery] = useState('');

  const toggleActiveState = useCallback(() => setActiveState(!active), [active]);

  const map = useContext(MapContext);

  useEffect(() => {
    const handleKeyDown = (event) => {
      const { key } = event;
      if (key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        toggleActiveState();
      }
    };

    const handleOutsideClick = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        toggleActiveState();
      }
    };

    if (active) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('keydown', handleKeyDown);
    } else {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [active, toggleActiveState]);

  const onKeyDown = (event) => {
    const { key } = event;
    if (key === 'Enter') {
      event.preventDefault();
      newInputValue();
      setQuery('');
    }
  };

  const onSearchValueChange = (event) => {
    setQuery(event.target.value);
  };

  const newInputValue = () => {
    const locationObject = calcActualGpsPositionForRawText(query, gpsFormat);
    const value = { lng: (parseFloat(locationObject.longitude) * 10) / 10, lat: (parseFloat(locationObject.latitude) * 10) / 10 };
    console.log('value', value);
    const coords = [value.lng, value.lat];
    jumpToLocation(map, coords, 12);
    const validatedCoords = coords[0] && coords[1] && validateLngLat(coords[0], coords[1]);
    validatedCoords && showPopup('dropped-marker', { location: value, coords } );
  };

  return <div className={styles.wrapper} ref={wrapperRef}>
    <button type='button'
      className={styles.button}
      onClick={toggleActiveState}
      ref={buttonRef}>
      <SearchIcon className={styles.searchButton}/>
    </button>
    <Overlay show={active} target={buttonRef.current}
      container={wrapperRef.current} placement='right'>
      <Popover placement='right'>
        <Popover.Content>
          <div className={styles.popover}>
            <GpsInput
              value = {query}
              onKeyDown={onKeyDown}
              onChange={onSearchValueChange}
            />
          </div>
        </Popover.Content>
      </Popover>
    </Overlay>
  </div>;
};

const mapStateToProps = ({ view: { userPreferences: { gpsFormat, showPopup } } }) => ({
  gpsFormat,
  showPopup
});

export default connect(mapStateToProps, { showPopup })(memo(LocationSearch));