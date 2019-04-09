import React, { useEffect } from 'react';
import { connect } from 'react-redux';
import { Dropdown } from 'react-bootstrap';

import NavHomeItem from '../NavHomeItem';
import { setHomeMap } from '../../ducks/maps';

import styles from './styles.module.scss';

const { Toggle, Menu, Item } = Dropdown;

const NavHomeMenu = function NavHomeMenu(props) {
  const { homeMap, maps, setHomeMap } = props;

  const calculateSelectedMap = () => {
    return homeMap.id ? homeMap : maps[0];
  };

  const selectedMap = calculateSelectedMap();

  useEffect(() => {
    setHomeMap(selectedMap);
  }, []);

  return (
    <Dropdown className="home-select">
      <Toggle className={styles.toggle}>
        <NavHomeItem {...selectedMap} />
      </Toggle>
      <Menu className={styles.menu}>
        {maps.map(map =>
          <Item as="button" active={selectedMap.id === map.id ? "active" : null} className={styles.listItem} key={map.id} onClick={() => setHomeMap(map)}>
            <NavHomeItem {...map} />
          </Item>)}
      </Menu>
    </Dropdown>
  )
};


const mapStateToProps = ({ view: { homeMap } }) => ({ homeMap });

export default connect(mapStateToProps, { setHomeMap })(NavHomeMenu);