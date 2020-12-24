import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import Dropdown from 'react-bootstrap/Dropdown';
import { ReactComponent as UserIcon } from '../common/images/icons/user-profile.svg';
import styles from './styles.module.scss';
import { trackEvent } from '../utils/analytics';

const { Toggle, Menu, Item, Divider } = Dropdown;

const UserMenu = (props) => {
  const { user, selectedUserProfile, userProfiles, onProfileClick, onLogOutClick, ...rest } = props;
  const displayUser = selectedUserProfile.username ? selectedUserProfile : user;

  const onDropdownToggle = (isOpen) => {
    trackEvent('Main Toolbar', `${isOpen ? 'Open' : 'Close'} User Menu`);
  };

  const onLogOutItemClick = () => {
    onLogOutClick();
    trackEvent('Main Toolbar', 'Click \'Log Out\'');
  };

  return <Dropdown alignRight className={styles.menu} {...rest} onToggle={onDropdownToggle}>
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
      <Item id="ot-sdk-btn" class="ot-sdk-show-settings">Cookie Settings</Item>
      {/* <button id="ot-sdk-btn" class="ot-sdk-show-settings">Cookie Settings</button> */}
      <Item onClick={onLogOutItemClick}>Log out</Item>
    </Menu>
  </Dropdown>;
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