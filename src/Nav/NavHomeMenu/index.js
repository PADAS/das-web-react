import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import { Dropdown } from 'react-bootstrap';

import NavHomeItem from '../NavHomeItem';
import { setHomeMap } from '../../ducks/maps';

import styles from './styles.module.scss';

const { Toggle, Menu, Item } = Dropdown;

class NavHomeMenu extends PureComponent {
  calculateSelectedMap() {
    return this.props.homeMap.id ? this.props.homeMap : this.props.maps[0];
  }
  componentDidMount() {
    this.onItemSelect(this.calculateSelectedMap());
  }

  onItemSelect(selectedItem) {
    this.props.setHomeMap(selectedItem);
  }
  renderList() {
    return this.props.maps.map(map =>
    <Item className={styles.listItem} key={map.id} onClick={() => this.onItemSelect(map)}>
      <NavHomeItem {...map} />
    </Item>);
  }
  render() {
    return (
      <Dropdown className="home-select">
        <Toggle className={styles.toggle}>
          <NavHomeItem {...this.calculateSelectedMap()} />
        </Toggle>
        <Menu className={styles.menu}>
          {this.renderList()}
        </Menu>
      </Dropdown>
    );
  }
}

const mapStateToProps = ({ view: { homeMap } }) => ({ homeMap });

export default connect(mapStateToProps, { setHomeMap })(NavHomeMenu);