import { lazy, memo, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation } from 'react-router';
import { useTranslation } from 'react-i18next';

import { ReactComponent as MenuIcon } from '../common/images/icons/menu.svg';

import { addModal } from '../ducks/modals';
import { APP_ROUTES } from '../constants/routes';
import { BREAKPOINTS, MAX_ZOOM, REACT_APP_ROUTE_PREFIX } from '../constants';
import { clearAuth } from '../ducks/auth';
import { clearUserProfile, fetchCurrentUser, fetchCurrentUserProfiles, setUserProfile } from '../ducks/user';
import getWindowLocation from '../utils/getWindowLocation';
import { GLOBAL_MENU_DRAWER_ID } from '../Drawer';
import { MAIN_TOOLBAR_CATEGORY, trackEventFactory } from '../utils/analytics';
import { setHomeMap } from '../ducks/maps';
import { showDrawer } from '../ducks/drawer';
import useJumpToLocation from '../hooks/useJumpToLocation';
import { useMatchMedia } from '../hooks';
import { useMessagesPermissions } from '../hooks/usePermissions';
import useNavigate from '../hooks/useNavigate';

import EarthRangerLogo from '../EarthRangerLogo';
import NavHomeMenu from './NavHomeMenu';
import NotificationMenu from '../NotificationMenu';
import ProfilePINModal from '../ProfilePINModal';
import SystemStatus from '../SystemStatus';
import UserMenu from '../UserMenu';

import * as styles from './styles.module.scss';

const MessageMenu = lazy(() => import('./MessageMenu'));

const CURRENT_LOCATION_ZOOM = MAX_ZOOM - 2;
const PROFILE_PERSISTENCE_CHECK_INTERVAL = 250;

const mainToolbarTracker = trackEventFactory(MAIN_TOOLBAR_CATEGORY);

// The page reloads only once the switch reaches storage, or the reloaded app
// would come back as the previous user.
const reloadOnceProfileIsPersisted = (isMainUser) => {
  setTimeout(() => {
    const isProfilePersisted = !!window.localStorage.getItem('persist:userProfile')?.includes('username');
    if (isMainUser ? !isProfilePersisted : isProfilePersisted) {
      getWindowLocation().reload(true);
    } else {
      reloadOnceProfileIsPersisted(isMainUser);
    }
  }, PROFILE_PERSISTENCE_CHECK_INTERVAL);
};

const Nav = () => {
  const auth0 = useAuth0();
  const dispatch = useDispatch();
  const location = useLocation();
  const { t } = useTranslation('top-bar', { keyPrefix: 'nav' });

  const { hasMessagesReadPermission } = useMessagesPermissions();
  const isMediumLayoutOrLarger = useMatchMedia(BREAKPOINTS.screenIsMediumLayoutOrLarger);
  const jumpToLocation = useJumpToLocation();
  const navigate = useNavigate();

  const homeMap = useSelector((state) => state.view.homeMap);
  const isGlobalMenuOpen = useSelector(
    (state) => state.view.drawer.isOpen && state.view.drawer.drawerId === GLOBAL_MENU_DRAWER_ID
  );
  const isIdpRequired = useSelector((state) => !!state.view.systemConfig?.require_idp);
  const maps = useSelector((state) => state.data.maps);
  const selectedUserProfile = useSelector((state) => state.data.selectedUserProfile);
  const user = useSelector((state) => state.data.user);
  const userProfiles = useSelector((state) => state.data.userProfiles);

  const changeProfile = (profile) => {
    const isMainUser = profile.username === user.username;
    if (isMainUser) {
      dispatch(clearUserProfile());

      mainToolbarTracker.track('Select to operate as the main user');
    } else {
      dispatch(setUserProfile(profile, true));

      mainToolbarTracker.track('Select to operate as a user profile');
    }

    reloadOnceProfileIsPersisted(isMainUser);
  };

  const logOut = async () => {
    try {
      await dispatch(clearAuth());

      if (isIdpRequired) {
        auth0.logout({ logoutParams: { returnTo: `${window.location.origin}${REACT_APP_ROUTE_PREFIX}` } });
      } else {
        navigate({ pathname: APP_ROUTES.LOGIN }, { replace: true });
      }
    } catch (error) {
      console.warn('error logging out', error);

      await dispatch(clearAuth());

      navigate({ pathname: APP_ROUTES.LOGIN }, { replace: true });
    }
  };

  const onCurrentLocationClick = (userLocation) => {
    jumpToLocation([userLocation.coords.longitude, userLocation.coords.latitude], CURRENT_LOCATION_ZOOM);

    mainToolbarTracker.track('Click \'My Current Location\'');
  };

  const onHomeMapSelect = (chosenMap) => {
    dispatch(setHomeMap(chosenMap));
    jumpToLocation(chosenMap.center, chosenMap.zoom);

    mainToolbarTracker.track('Change Home Area', `Home Area:${chosenMap.title}`);
  };

  const onProfileClick = (profile) => {
    if (profile.pin) {
      dispatch(addModal({
        content: ProfilePINModal,
        modalProps: { className: styles.profilePinModal },
        onSuccess: () => changeProfile(profile),
        profile,
      }));
    } else {
      changeProfile(profile);
    }
  };

  useEffect(() => {
    dispatch(fetchCurrentUser())
      .catch(() => navigate({ pathname: APP_ROUTES.LOGIN, search: location.search }));
    dispatch(fetchCurrentUserProfiles());
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return <header className={styles.primaryNav}>
    <div className={styles.leftControls}>
      <button
        aria-expanded={isGlobalMenuOpen}
        aria-haspopup="dialog"
        aria-label={t('hamburgerMenuLabel')}
        className={styles.globalMenuButton}
        onClick={() => dispatch(showDrawer(GLOBAL_MENU_DRAWER_ID))}
        title={t('hamburgerMenuLabel')}
        type="button"
      >
        <MenuIcon aria-hidden="true" className={styles.globalMenuIcon} />
      </button>

      <div className={styles.logoWrapper}>
        <EarthRangerLogo className={styles.logo} role="img" />
      </div>

      {!isMediumLayoutOrLarger && <SystemStatus />}
    </div>

    {!!maps.length && <div className={styles.centerControls}>
      <NavHomeMenu
        maps={maps}
        onCurrentLocationClick={onCurrentLocationClick}
        onMapSelect={onHomeMapSelect}
        selectedMap={homeMap}
      />
    </div>}

    <div className={styles.rightControls}>
      {isMediumLayoutOrLarger && <SystemStatus />}

      {hasMessagesReadPermission && <MessageMenu />}

      <NotificationMenu />

      <UserMenu
        onLogOutClick={logOut}
        onProfileClick={onProfileClick}
        selectedUserProfile={selectedUserProfile}
        user={user}
        userProfiles={userProfiles}
      />
    </div>
  </header>;
};

export default memo(Nav);
