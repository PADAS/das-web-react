import React, { memo, forwardRef, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import debounceRender from 'react-debounce-render';
import { connect } from 'react-redux';

import Overlay from 'react-bootstrap/Overlay';
import Popover from 'react-bootstrap/Popover';

import { setModalVisibilityState } from '../ducks/modals';
import { updateUserPreferences } from '../ducks/user-preferences';
import { calcGpsDisplayString } from '../utils/location';

import GpsInput from '../GpsInput';
import MapLocationPicker from '../MapLocationPicker';
import GeoLocator from '../GeoLocator';
import TextCopyBtn from '../TextCopyBtn';

import { ReactComponent as LocationIcon } from '../common/images/icons/marker-feed.svg';

import styles from './styles.module.scss';

const PopoverComponent = memo(forwardRef((props, ref) => { /* eslint-disable-line react/display-name */
  const {
    className,
    gpsPopoverOpen,
    popoverContentRef,
    onLocationChange,
    location,
    handleGpsInputKeydown,
    map,
    onLocationSelectFromMapStart,
    onLocationSelectFromMapCancel,
    onLocationSelectFromMap,
    showUserLocation,
    onGeoLocationStart,
    onGeoLocationSuccess,
  } = props;

  return <Popover placement='bottom' className={className}>
    {!!gpsPopoverOpen && <div ref={popoverContentRef}>
      <GpsInput onValidChange={onLocationChange} lngLat={location} onKeyDown={handleGpsInputKeydown} />
      <div className={styles.locationButtons}>
        <MapLocationPicker map={map} onLocationSelectStart={onLocationSelectFromMapStart} onLocationSelectCancel={onLocationSelectFromMapCancel} onLocationSelect={onLocationSelectFromMap} />
        {!!showUserLocation && <GeoLocator className={styles.geoLocator} onStart={onGeoLocationStart} onSuccess={onGeoLocationSuccess} />}
      </div>
    </div>}
  </Popover>;
}));

const LocationSelectorInput = (props) => {
  const { copyable = true, label, popoverClassName, iconPlacement, location, map, onLocationChange, placeholder, updateUserPreferences, setModalVisibilityState, sidebarOpen, gpsFormat, showUserLocation } = props;

  const gpsInputAnchorRef = useRef(null);
  const gpsInputLabelRef = useRef(null);
  const popoverContentRef = useRef(null);

  const sidebarOpenBeforeGpsSelectStart = useRef(null);

  const [gpsPopoverOpen, setGpsPopoverState] = useState(false);

  const hideGpsPopover = useCallback(() => {
    setGpsPopoverState(false);
  }, []);

  const onClickLocationAnchor = useCallback((event) => {
    event.preventDefault();
    event.stopPropagation();
    setGpsPopoverState(!gpsPopoverOpen);
  }, [gpsPopoverOpen]);
  

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (popoverContentRef.current && !popoverContentRef.current.contains(e.target)) {
        hideGpsPopover();
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);  /* eslint-disable-line react-hooks/exhaustive-deps */

  const onLocationSelectFromMapStart = useCallback(() => {
    sidebarOpenBeforeGpsSelectStart.current = !!sidebarOpen;
    setModalVisibilityState(false);
    updateUserPreferences({ sidebarOpen: false });
  }, [setModalVisibilityState, sidebarOpen, updateUserPreferences]);
  
  const onLocationSelectFromMapCancel = () => {
    if (sidebarOpenBeforeGpsSelectStart.current) {
      updateUserPreferences({ sidebarOpen: true });
    }

    setModalVisibilityState(true);
  };

  const onGeoLocationStart = () => {
    // trackEvent('Event Report', 'Click \'Use My Location\'');
  };

  const onGeoLocationSuccess = useCallback((coords) => {
    onLocationChange([coords.longitude, coords.latitude]);
    setModalVisibilityState(true);
    hideGpsPopover();
  }, [hideGpsPopover, onLocationChange, setModalVisibilityState]);

  const onLocationSelectFromMap = useCallback((event) => {
    if (sidebarOpenBeforeGpsSelectStart.current) {
      updateUserPreferences({ sidebarOpen: true });
    }

    const { lngLat: { lat, lng } } = event;
    onLocationChange([lng, lat]);
    setModalVisibilityState(true);
    hideGpsPopover();
  }, [hideGpsPopover, onLocationChange, setModalVisibilityState, updateUserPreferences]);

  const handleEscapePress = useCallback((event) => {
    const { key } = event;
    if (key === 'Escape' 
    && gpsPopoverOpen) {
      event.preventDefault();
      event.stopPropagation();
      hideGpsPopover();
    }
  }, [gpsPopoverOpen, hideGpsPopover]);

  const handleGpsInputKeydown = useCallback((event) => {
    const { key } = event;
    if (key === 'Enter') {
      hideGpsPopover();
    }
  }, [hideGpsPopover]);

  const popoverClassString = useMemo(() => {
    return popoverClassName ? `${styles.gpsPopover} ${popoverClassName}` : styles.gpsPopover;
  }, [popoverClassName]);

  const displayString = location ? calcGpsDisplayString(location[1], location[0], gpsFormat) : placeholder;
  const showCopyBtn = copyable && (displayString !== placeholder);

  const stopEventBubbling = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  
  return <label onClick={stopEventBubbling} ref={gpsInputLabelRef} onKeyDown={handleEscapePress} className={styles.locationSelectionLabel}>
    {iconPlacement === 'label' && <LocationIcon className={styles.icon} />}
    {!!label && <span>{label}</span>}
    <Overlay shouldUpdatePosition={true} show={gpsPopoverOpen} target={gpsInputAnchorRef.current} rootClose onHide={hideGpsPopover} container={gpsInputLabelRef.current}>
      <PopoverComponent popoverContentRef={popoverContentRef}
        className={popoverClassString}
        onLocationChange={onLocationChange}
        location={location}
        gpsPopoverOpen={gpsPopoverOpen}
        handleGpsInputKeydown={handleGpsInputKeydown}
        map={map}
        onLocationSelectFromMapStart={onLocationSelectFromMapStart}
        onLocationSelectFromMapCancel={onLocationSelectFromMapCancel}
        onLocationSelectFromMap={onLocationSelectFromMap}
        showUserLocation={showUserLocation}
        onGeoLocationStart={onGeoLocationStart}
        onGeoLocationSuccess={onGeoLocationSuccess} />
    </Overlay>
      <a href="#" onClick={onClickLocationAnchor} className={`${styles.locationAnchor} ${!!location ? '' : 'empty'}`} ref={gpsInputAnchorRef}> {/* eslint-disable-line */}
      {iconPlacement === 'input' && <LocationIcon className={styles.icon} />}
      {displayString}
      {showCopyBtn && <TextCopyBtn text={displayString} className={styles.locationCopyBtn} />}
    </a>
  </label>;
};

const mapStateToProps = ({ view: { showUserLocation, userPreferences: { gpsFormat, sidebarOpen } } }) => ({
  gpsFormat,
  showUserLocation,
  sidebarOpen,
});

const mapDispatchToProps = (dispatch) => ({
  setModalVisibilityState: (state) => dispatch(setModalVisibilityState(state)),
  updateUserPreferences: (preference) => dispatch(updateUserPreferences(preference)),
});

export default debounceRender(connect(mapStateToProps, mapDispatchToProps)(memo(LocationSelectorInput)));

LocationSelectorInput.defaultProps = {
  label: 'Location:',
  placeholder: 'Click here to set location',
  iconPlacement: 'label',
};

LocationSelectorInput.propTypes = {
  popoverClassName: PropTypes.string,
  placeholder: PropTypes.string,
  label: PropTypes.string,
  iconPlacement: PropTypes.oneOf(['label', 'input', 'none']),
  location: PropTypes.array,
  map: PropTypes.object.isRequired,
  onLocationChange: PropTypes.func.isRequired,
};