import React, { Fragment, useState, useEffect, useRef, memo } from 'react';
import { connect } from 'react-redux';

import { fetchEventTypes } from '../../ducks/event-types';
import { fetchBaseLayers } from '../../ducks/layers';

import { jumpToLocation } from '../../utils/map';

import EarthRangerMap from '../../EarthRangerMap';
import { fetchEventSchema } from '../../ducks/event-schemas';
import AddReport from '../../AddReport';
import ModalRenderer from '../../ModalRenderer';
import ErrorBoundary from '../../ErrorBoundary';
import UserCurrentLocationLayer from '../../UserCurrentLocationLayer';
import MapImagesLayer from '../../MapImagesLayer';
import LoadingOverlay from '../../LoadingOverlay';

import { ReactComponent as ReportTypeIconSprite } from '../../common/images/sprites/event-svg-sprite.svg';

import './styles.scss';


const FileReportView = (props) => {
  const { eventTypes, fetchBaseLayers, fetchEventSchema, fetchEventTypes, userLocation } = props;
  const containerRef = useRef(null);
  const [map, setMap] = useState(null);
  const [loading, setLoadState] = useState(true);
  const [locationInitialized, setLocationInit] = useState(false);
  const [locationDenied, setLocationDenied] = useState(false);

  const onMapLoaded = (map) => {
    window.map = map;
    setMap(map);
  };

  const onLocationClick = () => console.log('clicky wicky');

  useEffect(() => {
    fetchEventTypes();
    fetchBaseLayers();
    fetchEventSchema();
    setTimeout(() => {
      if (window.zE && window.zE.hide) {
        window.zE(function () {
          window.zE.hide();
        });
      }
    }, 2000);
  }, []);

  useEffect(() => {
    if (!locationInitialized && !!userLocation) {
      setLocationInit(true);
      jumpToLocation(map, [userLocation.coords.longitude, userLocation.coords.latitude], 17);
    }
  }, [locationInitialized, userLocation]);

  useEffect(() => {
    if (!!eventTypes.length && map && locationInitialized) {
      setLoadState(false);
    }
  }, [map, eventTypes, locationInitialized])

  if (locationDenied) return <div className='fileReportWrapper'>
    <h3>Location access required.</h3>
    <p>Please enable location access and try again.</p>
  </div>;

  return !!eventTypes.length && <div className='fileReportWrapper' ref={containerRef}>
    {loading && <LoadingOverlay className='loading-overlay' />}
    {map && userLocation && <div className='add-report-container'>
      <ErrorBoundary>
        <AddReport reportData={{
      location: {
        latitude: userLocation.coords.latitude,
        longitude: userLocation.coords.longitude,
      }
    }} showCancel={true} container={containerRef} map={map} />
      </ErrorBoundary>
      <ErrorBoundary>
        <ModalRenderer />
      </ErrorBoundary>
    </div>}
    <EarthRangerMap onMapLoaded={onMapLoaded}>
      {map && <Fragment>
        <UserCurrentLocationLayer onLocationPermissionDenied={() => setLocationDenied(true)} onlyShowInViewBounds={false} onIconClick={onLocationClick} />}
        <MapImagesLayer />
      </Fragment>}
    </EarthRangerMap>
    <ReportTypeIconSprite id="reportTypeIconSprite" />
  </div>
};

const mapStateToProps = ({ data: { eventTypes }, view: { userLocation } }) => ({
  eventTypes,
  userLocation,
});
export default connect(mapStateToProps, { fetchBaseLayers, fetchEventSchema, fetchEventTypes })(memo(FileReportView));