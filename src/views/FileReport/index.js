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


import { ReactComponent as ReportTypeIconSprite } from '../../common/images/sprites/event-svg-sprite.svg';

import './styles.scss';


const FileReportView = (props) => {
  const { eventTypes, fetchBaseLayers, fetchEventSchema, fetchEventTypes, userLocation } = props;
  console.log('userLocation', userLocation);
  const containerRef = useRef(null);
  const [map, setMap] = useState(null);
  const [locationInitialized, setLocationInit] = useState(false);

  const onMapLoaded = (map) => {
    window.map = map;
    setMap(map);
  };

  const onLocationClick = () => console.log('clicky wicky');

  useEffect(() => {
    fetchEventTypes();
    fetchBaseLayers();
    fetchEventSchema();
  }, []);

  useEffect(() => {
    if (!locationInitialized && !!userLocation) {
      setLocationInit(true);
      jumpToLocation(map, [userLocation.coords.longitude, userLocation.coords.latitude], 18);
    }
  }, [locationInitialized, userLocation]);

  return !!eventTypes.length && <div className='wrapper'>
    {map && <div className='add-report-container' ref={containerRef}>
      <ErrorBoundary>
        <AddReport container={containerRef} map={map} />
      </ErrorBoundary>
      <ErrorBoundary>
        <ModalRenderer />
      </ErrorBoundary>
    </div>}
    <EarthRangerMap onMapLoaded={onMapLoaded}>
      {map && <Fragment>
        <UserCurrentLocationLayer onlyShowInViewBounds={false} onIconClick={onLocationClick} />}
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