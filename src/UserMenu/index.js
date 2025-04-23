import React, { useRef } from 'react';
import Dropdown from 'react-bootstrap/Dropdown';
import { useTranslation } from 'react-i18next';

import { ReactComponent as UserIcon } from '../common/images/icons/user-profile.svg';

import { MAIN_TOOLBAR_CATEGORY, trackEventFactory } from '../utils/analytics';

import * as styles from './styles.module.scss';

const mainToolbarTracker = trackEventFactory(MAIN_TOOLBAR_CATEGORY);

const UserMenu = ({
  onLogOutClick,
  onProfileClick,
  selectedUserProfile = null,
  user,
  userProfiles = [],
  ...restProps
}) => {
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

        {window.Osano?.cm && (
          <Dropdown.Item onClick={() => window.Osano.cm.showDrawer('osano-cm-dom-info-dialog-open')}>
            {t('cookieSettingsItem')}
          </Dropdown.Item>
        )}

        <Dropdown.Item onClick={onLogOutItemClick}>{t('logoutItem')}</Dropdown.Item>
      </Dropdown.Menu>
    </Dropdown>
  </>;
};

export default UserMenu;
