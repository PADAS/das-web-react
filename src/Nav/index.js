import React, { memo, useEffect } from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { clearUserProfile, fetchCurrentUser, fetchCurrentUserProfiles, setUserProfile } from '../ducks/user';
import { clearAuth } from '../ducks/auth';
import { setHomeMap } from '../ducks/maps';
import { jumpToLocation } from '../utils/map';
import { trackEventFactory, MAIN_TOOLBAR_CATEGORY } from '../utils/analytics';

import { usePermissions } from '../hooks';

import { MAX_ZOOM, PERMISSION_KEYS, PERMISSIONS } from '../constants';

import NavHomeMenu from './NavHomeMenu';
import MessageMenu from './MessageMenu';
import UserMenu from '../UserMenu';
import EarthRangerLogo from '../EarthRangerLogo';
import DataExportMenu from '../DataExportMenu';
import SystemStatusComponent from '../SystemStatus';
import NotificationMenu from '../NotificationMenu';

import { REACT_APP_ROUTE_PREFIX } from '../constants';

import './Nav.scss';

const mainToolbarTracker = trackEventFactory(MAIN_TOOLBAR_CATEGORY);

const Nav = ({ clearAuth, clearUserProfile, fetchCurrentUser, fetchCurrentUserProfiles, history, homeMap, location, map, maps, setHomeMap, selectedUserProfile, setUserProfile, user, userProfiles }) => {

  const canViewMessages = usePermissions(PERMISSION_KEYS.MESSAGING, PERMISSIONS.READ);

  const onHomeMapSelect = (chosenMap) => {
    setHomeMap(chosenMap);
    mainToolbarTracker.track('Change Home Area', `Home Area:${chosenMap.title}`);
  };

  const onCurrentLocationClick = (location) => {
    jumpToLocation(map, [location.coords.longitude, location.coords.latitude], MAX_ZOOM);
    mainToolbarTracker.track('Click \'My Current Location\'');
  };

  const onProfileClick = (profile) => {
    const isMainUser = profile.username === user.username;

    if (isMainUser) {
      clearUserProfile();
      mainToolbarTracker.track('Select to operate as the main user');
    } else {
      mainToolbarTracker.track('Select to operate as a user profile');
      setUserProfile(profile, isMainUser ? false : true);
    }

  };

  useEffect(() => {
    map && maps.length && !homeMap.id && onHomeMapSelect(maps.find(m => m.default) || maps[0]);
  }, [map, maps]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchCurrentUser()
      .catch((error) => {
        history.push({
          pathname: `${REACT_APP_ROUTE_PREFIX}login`,
          search: location.search,
        });
      });
    fetchCurrentUserProfiles();
  }, []); // eslint-disable-line

  return <nav className="primary-nav">
    <div className="left-controls">
      <SystemStatusComponent />
      <EarthRangerLogo className="logo" />
    </div>

    {!!maps.length && <NavHomeMenu maps={maps} selectedMap={homeMap} onMapSelect={onHomeMapSelect} onCurrentLocationClick={onCurrentLocationClick} />}
    <div className="rightMenus">
      {!!canViewMessages && <MessageMenu />}
      <NotificationMenu />
      <UserMenu user={user} onProfileClick={onProfileClick} userProfiles={userProfiles} selectedUserProfile={selectedUserProfile} onLogOutClick={clearAuth} />
      <div className="alert-menu"></div>
      <DataExportMenu title="Toggle the data export menu" className="data-export-menu" />
    </div>
  </nav>;
};

const mapStatetoProps = ({ data: { maps, user, userProfiles, selectedUserProfile }, view: { homeMap } }) => ({ homeMap, maps, user, userProfiles, selectedUserProfile });

export default connect(mapStatetoProps, { clearAuth, clearUserProfile, fetchCurrentUser, setHomeMap, fetchCurrentUserProfiles, setUserProfile })(memo(withRouter(Nav)));
