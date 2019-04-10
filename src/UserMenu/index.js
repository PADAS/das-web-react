import React, { memo, Fragment } from 'react';
import PropTypes from 'prop-types';
import { Dropdown } from 'react-bootstrap';
import { ReactComponent as UserIcon } from '../common/images/icons/user-profile.svg';
import styles from './styles.module.scss';


const { Toggle, Menu, Item, Divider } = Dropdown;

const UserMenu = (props) => {
  const { user, selectedUserProfile, userProfiles, onProfileClick, onLogOutClick, ...rest } = props;
  const displayUser = selectedUserProfile.username ? selectedUserProfile : user;

  return <Dropdown alignRight className={styles.menu} {...rest}>
    <Toggle>
      <UserIcon className={styles.icon} />{displayUser.username}
    </Toggle>
    <Menu>
      {!!userProfiles.length &&
        <Fragment>
          {[user, ...userProfiles]
            .filter(({ username }) => username !== displayUser.username)
            .map((profile, index) =>
              <Item key={`${profile.id}-${index}`} onClick={() => onProfileClick(profile)}>
                {profile.username}
              </Item>
            )}
          <Divider />
        </Fragment>}
      <Item onClick={onLogOutClick}>Log out</Item>
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