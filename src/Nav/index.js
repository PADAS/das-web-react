import React, { memo, useEffect } from 'react';
import { connect } from 'react-redux';
import { fetchCurrentUser, fetchCurrentUserProfiles, setUserProfile } from '../ducks/user';
import { clearAuth } from '../ducks/auth';

import NavHomeMenu from './NavHomeMenu';
import UserMenu from '../UserMenu';
import EarthRangerLogo from '../EarthRangerLogo';
import SystemStatusComponent from '../SystemStatus';

import './Nav.scss';

const Nav = memo(({ clearAuth, fetchCurrentUser, fetchCurrentUserProfiles, maps, user, userProfiles, selectedUserProfile, setUserProfile }) => {
  useEffect(() => {
    fetchCurrentUser();
    fetchCurrentUserProfiles();
  }, []);
  return <nav>
    <div className="left-controls">
      <SystemStatusComponent />
      <EarthRangerLogo className="logo" />
    </div>

    {!!maps.length && <NavHomeMenu maps={maps} />}
    <div>
      <UserMenu user={user} onProfileClick={setUserProfile} userProfiles={userProfiles} selectedUserProfile={selectedUserProfile} onLogOutClick={clearAuth} />
      <div className="alert-menu"></div>
      <div className="hamburger-mehu"></div>
    </div>
  </nav>
});

const mapStatetoProps = ({ data: { maps, user, userProfiles, selectedUserProfile } }) => ({ maps, user, userProfiles, selectedUserProfile });

export default connect(mapStatetoProps, { clearAuth, fetchCurrentUser, fetchCurrentUserProfiles, setUserProfile })(Nav);