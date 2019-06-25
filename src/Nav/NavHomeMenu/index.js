import React from 'react';
import PropTypes from 'prop-types';
import Dropdown from 'react-bootstrap/Dropdown';

import NavHomeItem from '../NavHomeItem';

import styles from './styles.module.scss';

const { Toggle, Menu, Item } = Dropdown;

const NavHomeMenu = function NavHomeMenu(props) {
  const {  maps, onMapSelect, selectedMap } = props;

  return (
    <Dropdown className="home-select" alignRight>
      <Toggle className={styles.toggle}>
        <NavHomeItem {...selectedMap} />
      </Toggle>
      <Menu className={styles.menu}>
        {maps.map(map =>
          <Item as="button" active={selectedMap.id === map.id ? "active" : null} className={styles.listItem} key={map.id} onClick={() => onMapSelect(map)}>
            <NavHomeItem {...map} />
          </Item>)}
      </Menu>
    </Dropdown>
  )
};



export default NavHomeMenu;

NavHomeMenu.propTypes = {
  maps: PropTypes.array.isRequired,
  selectedMap: PropTypes.object.isRequired,
  onMapSelect: PropTypes.func.isRequired,
};