import { useId } from 'react';
import { useTranslation } from 'react-i18next';

import { ReactComponent as ArrowDownSmallIcon } from '../common/images/icons/arrow-down-small.svg';
import { ReactComponent as UserIcon } from '../common/images/icons/user-profile.svg';

import { MAIN_TOOLBAR_CATEGORY, trackEventFactory } from '../utils/analytics';
import useMenuToggle from '../hooks/useMenuToggle';

import Menu from '../Menu';

import * as styles from './styles.module.scss';

const EMPTY_USER_PROFILES = [];

const mainToolbarTracker = trackEventFactory(MAIN_TOOLBAR_CATEGORY);

const trackMenuToggle = (show) => mainToolbarTracker.track(`${show ? 'Open' : 'Close'} User Menu`);

const UserMenu = ({
  onLogOutClick,
  onProfileClick,
  selectedUserProfile = null,
  user,
  userProfiles = EMPTY_USER_PROFILES,
}) => {
  const { t } = useTranslation('top-bar', { keyPrefix: 'userMenu' });

  const menuToggle = useMenuToggle({ onToggle: trackMenuToggle });

  const profilesGroupLabelId = useId();

  const displayUser = selectedUserProfile?.username ? selectedUserProfile : user;

  const onLogOutOptionClick = () => {
    onLogOutClick();

    mainToolbarTracker.track('Click \'Log Out\'');
  };

  return <div className={styles.userMenu}>
    <button
      aria-label={t('toggleLabel', { username: displayUser.username })}
      className={styles.toggle}
      title={t('menuLabel')}
      type="button"
      {...menuToggle.toggleProps}
    >
      <UserIcon aria-hidden="true" className={styles.userIcon} />

      <span className={styles.username}>{displayUser.username}</span>

      <ArrowDownSmallIcon aria-hidden="true" className={styles.arrow} />
    </button>

    <Menu aria-label={t('menuLabel')} className={styles.menu} placement="bottom-end" {...menuToggle.menuProps}>
      {!!userProfiles.length && <>
        <li className={styles.profilesGroup} role="none">
          <span aria-hidden="true" className={styles.profilesGroupLabel} id={profilesGroupLabelId}>
            {t('userAndProfilesGroupLabel')}
          </span>

          <ul aria-labelledby={profilesGroupLabelId} className={styles.profilesList} role="group">
            {[user, ...userProfiles].map((profile) => <Menu.Option
              aria-checked={profile.username === displayUser.username}
              key={profile.id}
              onClick={() => onProfileClick(profile)}
              role="menuitemradio"
            >
              {profile.username}
            </Menu.Option>)}
          </ul>
        </li>

        <Menu.Divider />
      </>}

      {!!window.Osano?.cm && <Menu.Option
        onClick={() => window.Osano.cm.showDrawer('osano-cm-dom-info-dialog-open')}
      >
        {t('cookieSettingsItem')}
      </Menu.Option>}

      <Menu.Option onClick={onLogOutOptionClick}>{t('logoutItem')}</Menu.Option>
    </Menu>
  </div>;
};

export default UserMenu;
