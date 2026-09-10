import React, { lazy, memo, useCallback, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useAuth0 } from '@auth0/auth0-react';

import { addModal } from '../ducks/modals';
import { APP_ROUTES } from '../constants/routes';
import { BREAKPOINTS, MAX_ZOOM, REACT_APP_ROUTE_PREFIX } from '../constants';
import { clearAuth } from '../ducks/auth';
import { clearUserProfile, fetchCurrentUser, fetchCurrentUserProfiles, setUserProfile } from '../ducks/user';
import getWindowLocation from '../utils/getWindowLocation';
import { globalMenuDrawerId } from '../Drawer';
import { setHomeMap } from '../ducks/maps';
import { showDrawer } from '../ducks/drawer';
import { trackEventFactory, MAIN_TOOLBAR_CATEGORY } from '../utils/analytics';
import useJumpToLocation from '../hooks/useJumpToLocation';
import useNavigate from '../hooks/useNavigate';
import { useMatchMedia } from '../hooks';
import { useMessagesPermissions } from '../hooks/usePermissions';

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
      getWindowLocation().reload(true);
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
  const { logout: auth0Logout } = useAuth0();

  const isMediumLayoutOrLarger = useMatchMedia(BREAKPOINTS.screenIsMediumLayoutOrLarger);

  const { hasMessagesReadPermission } = useMessagesPermissions();

  const homeMap = useSelector((state) => state.view.homeMap);
  const maps = useSelector((state) => state.data.maps);
  const user = useSelector((state) => state.data.user);
  const userProfiles = useSelector((state) => state.data.userProfiles);
  const selectedUserProfile = useSelector((state) => state.data.selectedUserProfile);
  const systemConfig = useSelector((state) => state.view.systemConfig);
  const requireIdp = !!systemConfig?.require_idp;

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

  const handleLogout = useCallback(async () => {
    try {
      // Clear local auth state
      await dispatch(clearAuth());

      // Log out of IDP if enabled
      if (requireIdp) {
        auth0Logout({
          logoutParams: {
            returnTo: window.location.origin + REACT_APP_ROUTE_PREFIX,
          },
        });
      } else {
        navigate({ pathname: APP_ROUTES.LOGIN }, { replace: true });
      }

    } catch (error) {
      console.error('[Nav] Logout failed:', error);
      // Fallback: clear everything and navigate to login
      await dispatch(clearAuth());
      navigate({ pathname: APP_ROUTES.LOGIN }, { replace: true });
    }
  }, [dispatch, navigate, requireIdp, auth0Logout]);

  useEffect(() => {
    dispatch(fetchCurrentUser())
      .catch(() => navigate({ pathname: APP_ROUTES.LOGIN, search: location.search }));
    dispatch(fetchCurrentUserProfiles());
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return <header className="primary-nav">
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
      {isMediumLayoutOrLarger && <SystemStatus />}

      {hasMessagesReadPermission && <MessageMenu />}

      <NotificationMenu />

      <UserMenu
        onLogOutClick={handleLogout}
        onProfileClick={onProfileClick}
        selectedUserProfile={selectedUserProfile}
        user={user}
        userProfiles={userProfiles}
      />
    </div>
  </header>;
};

export default memo(Nav);
