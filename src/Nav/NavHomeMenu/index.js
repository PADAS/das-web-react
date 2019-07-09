import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import Dropdown from 'react-bootstrap/Dropdown';

import NavHomeItem from '../NavHomeItem';

import { ReactComponent as GpsLocationIcon } from '../../common/images/icons/gps-location-icon.svg';
import styles from './styles.module.scss';

const { Toggle, Menu, Item } = Dropdown;

const NavHomeMenu = function NavHomeMenu(props) {
  const { maps, onMapSelect, selectedMap, userLocation, onClickCurrentLocation } = props;

  return (
    <Dropdown className="home-select" alignRight>
      <Toggle className={styles.toggle}>
        <NavHomeItem {...selectedMap} />
      </Toggle>
      <Menu className={styles.menu}>
        {maps.map(map =>
          <Item as="button" active={selectedMap.id === map.id ? 'active' : null} className={styles.listItem} key={map.id} onClick={() => onMapSelect(map)}>
            <NavHomeItem {...map} />
          </Item>)}
        {userLocation && <Item className={styles.currentLocationJump} onClick={() => onClickCurrentLocation(userLocation)}>
          <h6>
            <GpsLocationIcon />
            My Current Location
          </h6>
        </Item>}
      </Menu>
    </Dropdown>
  );
};


const mapStateToProps = ({ view: { userLocation } }) => ({ userLocation });
export default connect(mapStateToProps, null)(NavHomeMenu);

NavHomeMenu.defaultProps = {
  onClickCurrentLocation() {

  },
};

NavHomeMenu.propTypes = {
  maps: PropTypes.array.isRequired,
  selectedMap: PropTypes.object.isRequired,
  onMapSelect: PropTypes.func.isRequired,
  onClickCurrentLocation: PropTypes.func,
};