import React, { useRef } from 'react';
import Dropdown from 'react-bootstrap/Dropdown';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';

import { ReactComponent as UserIcon } from '../common/images/icons/user-profile.svg';

import { MAIN_TOOLBAR_CATEGORY, trackEventFactory } from '../utils/analytics';

import styles from './styles.module.scss';

const mainToolbarTracker = trackEventFactory(MAIN_TOOLBAR_CATEGORY);

const UserMenu = ({ onLogOutClick, onProfileClick, selectedUserProfile, user, userProfiles, ...restProps }) => {
  const { t } = useTranslation('top-bar', { keyPrefix: 'userMenu' });

  const cookieSettingsRef = useRef();

  const displayUser = selectedUserProfile.username ? selectedUserProfile : user;

  const onLogOutItemClick = () => {
    onLogOutClick();

    mainToolbarTracker.track('Click \'Log Out\'');
  };

  return <>
    <button className="ot-sdk-show-settings" hidden id="ot-sdk-btn" ref={cookieSettingsRef} />

    <Dropdown
      align="end"
      className={styles.menu}
      {...restProps}
      onToggle={(isOpen) => mainToolbarTracker.track(`${isOpen ? 'Open' : 'Close'} User Menu`)}
      >
      <Dropdown.Toggle aria-label={t('toggleLabel')} data-testid="user-menu-toggle-btn" title={t('toggleTitle')}>
        <UserIcon className={styles.icon} />

        <span className={styles.username}>{displayUser.username}</span>
      </Dropdown.Toggle>

      <Dropdown.Menu>
        {!!userProfiles.length && <>
          {[user, ...userProfiles].map((profile, index) => <Dropdown.Item
            active={profile.username === displayUser.username ? 'active' : null}
            aria-label={profile.username}
            key={`${profile.id}-${index}`}
            onClick={() => onProfileClick(profile)}
          >
            {profile.username}
          </Dropdown.Item>)}

          <Dropdown.Divider />
        </>}

        <Dropdown.Item onClick={() => cookieSettingsRef.current.click()}>{t('cookieSettingsItem')}</Dropdown.Item>

        <Dropdown.Item onClick={onLogOutItemClick}>{t('logoutItem')}</Dropdown.Item>
      </Dropdown.Menu>
    </Dropdown>
  </>;
};

UserMenu.defaultProps = {
  userProfiles: [],
  selectedUserProfile: null,
};

UserMenu.propTypes = {
  onLogOutClick: PropTypes.func.isRequired,
  onProfileClick: PropTypes.func.isRequired,
  selectedUserProfile: PropTypes.shape({
    username: PropTypes.string,
  }),
  user: PropTypes.shape({
    id: PropTypes.string,
    username: PropTypes.string,
  }).isRequired,
  userProfiles: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string,
    username: PropTypes.string,
  })),
};

export default UserMenu;
