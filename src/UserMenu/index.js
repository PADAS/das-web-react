import React, { Fragment, useRef } from 'react';
import PropTypes from 'prop-types';
import Dropdown from 'react-bootstrap/Dropdown';
import { ReactComponent as UserIcon } from '../common/images/icons/user-profile.svg';
import styles from './styles.module.scss';
import { trackEventFactory, MAIN_TOOLBAR_CATEGORY } from '../utils/analytics';

const { Toggle, Menu, Item, Divider } = Dropdown;
const mainToolbarTracker = trackEventFactory(MAIN_TOOLBAR_CATEGORY);

const UserMenu = (props) => {
  const { user, selectedUserProfile, userProfiles, onProfileClick, onLogOutClick, ...rest } = props;
  const displayUser = selectedUserProfile.username ? selectedUserProfile : user;

  const cookieSettingsRef = useRef();

  const onDropdownToggle = (isOpen) => {
    mainToolbarTracker.track(`${isOpen ? 'Open' : 'Close'} User Menu`);
  };

  const onLogOutItemClick = () => {
    onLogOutClick();
    mainToolbarTracker.track('Click \'Log Out\'');
  };

  return <Fragment>
    <button hidden id="ot-sdk-btn" className="ot-sdk-show-settings" ref={cookieSettingsRef} />
    <Dropdown align="end" className={styles.menu} {...rest} onToggle={onDropdownToggle}>
      <Toggle>
        <UserIcon className={styles.icon} /><span className={styles.username}>{displayUser.username}</span>
      </Toggle>
      <Menu>
        {!!userProfiles.length &&
        <Fragment>
          {[user, ...userProfiles]
            // .filter(({ username }) => username !== displayUser.username)
            .map((profile, index) =>
              <Item active={profile.username === displayUser.username ? 'active' : null}
                key={`${profile.id}-${index}`}
                onClick={() => onProfileClick(profile)}>
                {profile.username}
              </Item>
            )}
          <Divider />
        </Fragment>}
        <Item onClick={() => cookieSettingsRef.current.click()}>Cookie Settings</Item>
        <Item onClick={onLogOutItemClick}>Log out</Item>
      </Menu>
    </Dropdown>
  </Fragment>;
};

UserMenu.defaultProps = {
  userProfiles: [],
  selectedUserProfile: null,
  onLogOutClick() {
    console.log('log out click');
  },
  onProfileClick() {
    console.log('profile click');
  },
};

UserMenu.propTypes = {
  user: PropTypes.object.isRequired,
  userProfiles: PropTypes.array,
  selectedUserProfile: PropTypes.object,
  onLogOutClick: PropTypes.func,
  onProfileClick: PropTypes.func,
};

export default UserMenu;