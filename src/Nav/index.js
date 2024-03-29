import React, { lazy, memo, useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { addModal } from '../ducks/modals';
import { BREAKPOINTS, MAX_ZOOM, PERMISSION_KEYS, PERMISSIONS, REACT_APP_ROUTE_PREFIX } from '../constants';
import { clearAuth } from '../ducks/auth';
import { clearUserProfile, fetchCurrentUser, fetchCurrentUserProfiles, setUserProfile } from '../ducks/user';
import { globalMenuDrawerId } from '../Drawer';
import { setHomeMap } from '../ducks/maps';
import { showDrawer } from '../ducks/drawer';
import { trackEventFactory, MAIN_TOOLBAR_CATEGORY } from '../utils/analytics';
import useJumpToLocation from '../hooks/useJumpToLocation';
import { useMatchMedia, usePermissions } from '../hooks';
import useNavigate from '../hooks/useNavigate';

import EarthRangerLogo from '../EarthRangerLogo';
import HamburgerMenuIcon from '../HamburgerMenuIcon';
import NavHomeMenu from './NavHomeMenu';
import NotificationMenu from '../NotificationMenu';
import ProfilePINModal from '../ProfilePINModal';
import SystemStatus from '../SystemStatus';
import UserMenu from '../UserMenu';

import './Nav.scss';

const MessageMenu = lazy(() => import('./MessageMenu'));

const mainToolbarTracker = trackEventFactory(MAIN_TOOLBAR_CATEGORY);

const reloadOnceProfileIsPersisted = (isMainUser) => {
  setTimeout(() => {
    const isProfilePersisted = !!window.localStorage.getItem('persist:userProfile')?.includes('username');
    if (isMainUser ? !isProfilePersisted : isProfilePersisted) {
      window.location.reload(true);
    } else {
      reloadOnceProfileIsPersisted();
    }
  }, [250]);
};

const Nav = () => {
  const dispatch = useDispatch();
  const jumpToLocation = useJumpToLocation();
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation('top-bar', { keyPrefix: 'nav' });

  const isMediumLayoutOrLarger = useMatchMedia(BREAKPOINTS.screenIsMediumLayoutOrLarger);
  const canViewMessages = usePermissions(PERMISSION_KEYS.MESSAGING, PERMISSIONS.READ);

  const homeMap = useSelector((state) => state.view.homeMap);
  const maps = useSelector((state) => state.data.maps);
  const user = useSelector((state) => state.data.user);
  const userProfiles = useSelector((state) => state.data.userProfiles);
  const selectedUserProfile = useSelector((state) => state.data.selectedUserProfile);

  const onHomeMapSelect = (chosenMap) => {
    dispatch(setHomeMap(chosenMap));
    jumpToLocation(chosenMap.center, chosenMap.zoom);

    mainToolbarTracker.track('Change Home Area', `Home Area:${chosenMap.title}`);
  };

  const onCurrentLocationClick = (location) => {
    jumpToLocation([location.coords.longitude, location.coords.latitude], (MAX_ZOOM - 2));

    mainToolbarTracker.track('Click \'My Current Location\'');
  };

  const handleProfileChange = useCallback((profile) => {
    const isMainUser = profile.username === user.username;
    if (isMainUser) {
      dispatch(clearUserProfile());

      mainToolbarTracker.track('Select to operate as the main user');
    } else {
      dispatch(setUserProfile(profile, true));

      mainToolbarTracker.track('Select to operate as a user profile');
    }

    reloadOnceProfileIsPersisted(isMainUser);
  }, [dispatch, user.username]);

  const onProfileClick = useCallback((profile) => {
    if (!profile.pin) {
      return handleProfileChange(profile);
    }

    return dispatch(addModal({
      content: ProfilePINModal,
      modalProps: { className: 'profile-pin-modal' },
      profile,
      onSuccess: () => handleProfileChange(profile),
    }));
  }, [dispatch, handleProfileChange]);

  useEffect(() => {
    dispatch(fetchCurrentUser())
      .catch(() => navigate({ pathname: `${REACT_APP_ROUTE_PREFIX}login`, search: location.search }));
    dispatch(fetchCurrentUserProfiles());
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return <nav className="primary-nav">
    <div className="left-controls">
      <HamburgerMenuIcon
        aria-label={t('hamburgerMenuLabel')}
        className="global-menu-button"
        onClick={() => dispatch(showDrawer(globalMenuDrawerId))}
        title={t('hamburgerMenuTitle')}
      />

      <div className="logo-wrapper">
        <EarthRangerLogo className="logo" />
      </div>

      {!isMediumLayoutOrLarger && <SystemStatus />}
    </div>

    {!!maps.length && <div className="center-controls">
      <NavHomeMenu
        maps={maps}
        onCurrentLocationClick={onCurrentLocationClick}
        onMapSelect={onHomeMapSelect}
        selectedMap={homeMap}
      />
    </div>}

    <div className="rightMenus">
      {!!isMediumLayoutOrLarger && <SystemStatus />}

      {!!canViewMessages && <MessageMenu />}

      <NotificationMenu />

      <UserMenu
        onLogOutClick={() => dispatch(clearAuth())}
        onProfileClick={onProfileClick}
        selectedUserProfile={selectedUserProfile}
        user={user}
        userProfiles={userProfiles}
      />
    </div>
  </nav>;
};

export default memo(Nav);
