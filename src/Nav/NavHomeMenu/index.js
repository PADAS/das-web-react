import React, { Fragment, memo } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import Dropdown from 'react-bootstrap/Dropdown';

import NavHomeItem from '../NavHomeItem';

import { userLocationCanBeShown } from '../../selectors';

import { ReactComponent as GpsLocationIcon } from '../../common/images/icons/gps-location-icon.svg';
import styles from './styles.module.scss';
import { trackEvent } from '../../utils/analytics';

const { Toggle, Menu, Item, Divider } = Dropdown;

const NavHomeMenu = function NavHomeMenu(props) {
  const { maps, onMapSelect, selectedMap, userLocation, userLocationCanBeShown, onCurrentLocationClick } = props;

  const onDropdownToggle = (isOpen) => {
    trackEvent('Main Toolbar', `${isOpen ? 'Open':'Close'} Home Area Menu`);
  };

  return (
    <Dropdown className="home-select" alignRight onToggle={onDropdownToggle}>
      <Toggle className={styles.toggle}>
        <NavHomeItem {...selectedMap} />
      </Toggle>
      <Menu className={styles.menu}>
        {maps.map(map =>
          <Item as="button" active={selectedMap.id === map.id ? 'active' : null} 
            className={styles.listItem} key={map.id} 
            onClick={()=>onMapSelect(map)}>
            <NavHomeItem {...map} />
          </Item>)}
        {userLocationCanBeShown && <Fragment>
          <Divider />
          <Item className={styles.currentLocationJump} 
            onClick={() => onCurrentLocationClick(userLocation)}>
            <h6>
              <GpsLocationIcon /> My Current Location
            </h6>
          </Item>
        </Fragment>}
      </Menu>
    </Dropdown>
  );
};

const mapStateToProps = (state) => ({
  userLocation: state.view.userLocation,
  userLocationCanBeShown: userLocationCanBeShown(state),
});
export default connect(mapStateToProps, null)(memo(NavHomeMenu));

NavHomeMenu.defaultProps = {
  onCurrentLocationClick() {
  },
};

NavHomeMenu.propTypes = {
  maps: PropTypes.array.isRequired,
  selectedMap: PropTypes.object.isRequired,
  onMapSelect: PropTypes.func.isRequired,
  onCurrentLocationClick: PropTypes.func,
};