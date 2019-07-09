import React, { memo, useEffect } from 'react';
import { connect } from 'react-redux';
import { fetchCurrentUser, fetchCurrentUserProfiles, setUserProfile } from '../ducks/user';
import { clearAuth } from '../ducks/auth';
import { setHomeMap } from '../ducks/maps';
import { jumpToLocation } from '../utils/map';


import NavHomeMenu from './NavHomeMenu';
import UserMenu from '../UserMenu';
import EarthRangerLogo from '../EarthRangerLogo';
import DataExportMenu from '../DataExportMenu';
import SystemStatusComponent from '../SystemStatus';

import './Nav.scss';

const Nav = ({ clearAuth, fetchCurrentUser, fetchCurrentUserProfiles, homeMap, map, maps, setHomeMap, selectedUserProfile, setUserProfile, user, userProfiles }) => {
  const handleHomeMapSelect = (chosenMap) => {
    const { zoom, center } = chosenMap;
    setHomeMap(chosenMap);

    jumpToLocation(map, center, zoom);
  };

  const onClickCurrentLocation = (location) => {
    jumpToLocation(map, [location.coords.longitude, location.coords.latitude], 18);
  };

  useEffect(() => {
    map && maps.length && !homeMap.id && handleHomeMapSelect(maps.find(m => m.default) || maps[0]);
  }, [map, maps]);


  useEffect(() => {
    fetchCurrentUser();
    fetchCurrentUserProfiles();
  }, []);
  return <nav className="primary-nav">
    <div className="left-controls">
      <SystemStatusComponent />
      <EarthRangerLogo className="logo" />
    </div>

    {!!maps.length && <NavHomeMenu maps={maps} selectedMap={homeMap} onMapSelect={handleHomeMapSelect} onClickCurrentLocation={onClickCurrentLocation} />}
    <div className="rightMenus">
      <UserMenu user={user} onProfileClick={setUserProfile} userProfiles={userProfiles} selectedUserProfile={selectedUserProfile} onLogOutClick={clearAuth} />
      <div className="alert-menu"></div>
      <DataExportMenu title="Toggle the data export menu" className="data-export-menu" />
    </div>
  </nav>;
};

const mapStatetoProps = ({ data: { maps, user, userProfiles, selectedUserProfile }, view: { homeMap } }) => ({ homeMap, maps, user, userProfiles, selectedUserProfile });

export default connect(mapStatetoProps, { clearAuth, fetchCurrentUser, setHomeMap, fetchCurrentUserProfiles, setUserProfile })(memo(Nav));
