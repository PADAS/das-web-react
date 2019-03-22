import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Dropdown } from 'react-bootstrap';

import NavHomeItem from '../NavHomeItem';
import { setHomeMap } from '../../ducks/maps';

import styles from './styles.module.scss';

const { Toggle, Menu, Item } = Dropdown;

class NavHomeMenu extends Component {
  constructor(props) {
    super(props);

    this.onItemSelect = this.onItemSelect.bind(this);
    this.state = {
      listShown: false,
      selectedItem: null,
    };
    this.renderList = this.renderList.bind(this);
    this.toggleMenu = this.toggleMenu.bind(this);
  }
  componentDidMount() {
    this.setState({
      selectedItem: this.props.homeMap.id ? this.props.homeMap : this.props.maps[0],
    }, () => {
      if (!this.props.homeMap.id) {
        this.onItemSelect(this.state.selectedItem);
      }
    });
  }
  toggleMenu() {
    this.setState({
      listShown: !this.state.listShown,
    });
  }
  openMenu() {
    this.setState({
      listShown: true,
    });
  }
  closeMenu() {
    this.setState({
      listShown: false,
    });
  }
  handleClickOutside() {
    this.closeMenu();
  }
  onItemSelect(selectedItem) {
    this.closeMenu();
    this.setState({
      selectedItem,
    });
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
          <NavHomeItem className={`selected ${styles.listItem}`} {...this.state.selectedItem} />
        </Toggle>
        <Menu>
          {this.renderList()}
        </Menu>
      </Dropdown>
    );
  }
}

const mapStateToProps = ({ view: { homeMap } }) => ({ homeMap });

export default connect(mapStateToProps, { setHomeMap })(NavHomeMenu);