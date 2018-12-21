import React, { Component } from 'react';
import { connect } from 'react-redux';
import NavHomeItem from '../NavHomeItem';
import { setHomeMap } from '../../ducks/maps';
import enhanceWithOutsideClick from 'react-click-outside';

class NavHomeMenu extends Component {
  constructor(props) {
    super(props);

    this.onItemSelect = this.onItemSelect.bind(this);
    this.state = {
      listShown: false,
      selectedItem: null,
    };
    this.toggleMenu = this.toggleMenu.bind(this);
  }
  componentDidMount() {
    this.setState({
      selectedItem: this.props.homeMap.id ? this.props.homeMap : this.props.maps[0],
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
    return this.props.maps.map(map => <NavHomeItem className={map.id === this.state.selectedItem.id ? 'current' : null} onClick={() => this.onItemSelect(map)} key={map.id} {...map} />);
  }
  render() {
    return (
      <ul className={this.state.listShown ? 'open' : 'closed'}>
        <NavHomeItem className="selected" onClick={this.toggleMenu} {...this.state.selectedItem} />
        { this.state.listShown ? this.renderList() : null }
      </ul>
    );
  }
}

const mapStateToProps = ({ view: { homeMap } }) => ({ homeMap });

export default connect(mapStateToProps, { setHomeMap })(enhanceWithOutsideClick(NavHomeMenu));