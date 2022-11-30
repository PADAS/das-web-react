import React, { lazy, memo, useEffect } from 'react';
import { connect } from 'react-redux';
import { useLocation } from 'react-router-dom';

import { clearUserProfile, fetchCurrentUser, fetchCurrentUserProfiles, setUserProfile } from '../ducks/user';
import { clearAuth } from '../ducks/auth';
import { globalMenuDrawerId } from '../Drawer';
import { setHomeMap } from '../ducks/maps';
import { showDrawer } from '../ducks/drawer';
import { trackEventFactory, MAIN_TOOLBAR_CATEGORY } from '../utils/analytics';
import { useMatchMedia, usePermissions } from '../hooks';
import useJumpToLocation from '../hooks/useJumpToLocation';
import useNavigate from '../hooks/useNavigate';

import { BREAKPOINTS, MAX_ZOOM, PERMISSION_KEYS, PERMISSIONS, REACT_APP_ROUTE_PREFIX } from '../constants';

import EarthRangerLogo from '../EarthRangerLogo';
import HamburgerMenuIcon from '../HamburgerMenuIcon';
import NavHomeMenu from './NavHomeMenu';
import UserMenu from '../UserMenu';
import SystemStatus from '../SystemStatus';
import NotificationMenu from '../NotificationMenu';

import './Nav.scss';

const mainToolbarTracker = trackEventFactory(MAIN_TOOLBAR_CATEGORY);
const MessageMenu = lazy(() => import('./MessageMenu'));

const Nav = ({
  clearAuth,
  clearUserProfile,
  fetchCurrentUser,
  fetchCurrentUserProfiles,
  homeMap,
  map,
  maps,
  setHomeMap,
  showDrawer,
  selectedUserProfile,
  setUserProfile,
  user,
  userProfiles,
}) => {
  const jumpToLocation = useJumpToLocation();
  const location = useLocation();
  const navigate = useNavigate();

  const isMediumLayoutOrLarger = useMatchMedia(BREAKPOINTS.screenIsMediumLayoutOrLarger);
  const canViewMessages = usePermissions(PERMISSION_KEYS.MESSAGING, PERMISSIONS.READ);

  const onHomeMapSelect = (chosenMap) => {
    setHomeMap(chosenMap);
    mainToolbarTracker.track('Change Home Area', `Home Area:${chosenMap.title}`);
  };

  const onCurrentLocationClick = (location) => {
    jumpToLocation([location.coords.longitude, location.coords.latitude], (MAX_ZOOM - 2));
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
    setTimeout(() => {
      window.location.reload(true);
    }, [1000]);
  };

  useEffect(() => {
    map && maps.length && !homeMap.id && onHomeMapSelect(maps.find(m => m.default) || maps[0]);
  }, [map, maps]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchCurrentUser()
      .catch(() => {
        navigate({ pathname: `${REACT_APP_ROUTE_PREFIX}login`, search: location.search });
      });
    fetchCurrentUserProfiles();
  }, []); // eslint-disable-line

  return <nav className="primary-nav">
    <div className="left-controls">
      <HamburgerMenuIcon className="global-menu-button" onClick={() => showDrawer(globalMenuDrawerId)} />
      <div className="logo-wrapper">
        <EarthRangerLogo className="logo" />
      </div>
      {!isMediumLayoutOrLarger && <SystemStatus />}
    </div>

    {!!maps.length &&
      <div className="center-controls">
        <NavHomeMenu
          maps={maps}
          selectedMap={homeMap}
          onMapSelect={onHomeMapSelect}
          onCurrentLocationClick={onCurrentLocationClick}
        />
      </div>}

    <div className="rightMenus">
      {!!isMediumLayoutOrLarger && <SystemStatus />}
      {!!canViewMessages && <MessageMenu />}
      <NotificationMenu />
      <UserMenu
        user={user}
        onProfileClick={onProfileClick}
        userProfiles={userProfiles}
        selectedUserProfile={selectedUserProfile}
        onLogOutClick={clearAuth}
      />
      <div className="alert-menu"></div>
    </div>
  </nav>;
};

const mapStatetoProps = ({ data: { maps, user, userProfiles, selectedUserProfile }, view: { homeMap } }) =>
  ({ homeMap, maps, user, userProfiles, selectedUserProfile });

export default connect(
  mapStatetoProps,
  { clearAuth, clearUserProfile, fetchCurrentUser, setHomeMap, showDrawer, fetchCurrentUserProfiles, setUserProfile }
)(memo(Nav));
