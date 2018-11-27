import React, { Component } from 'react';
import { connect } from 'react-redux';
import NavHomeItem from '../NavHomeItem';
import SelectMenu from '../../SelectMenu';
import { setHomeMap } from '../../ducks/maps';

class NavHomeMenu extends Component {
  constructor(props) {
    super(props);

    this.onItemSelect = this.onItemSelect.bind(this);
  }
  onItemSelect(item) {
    this.props.setHomeMap(item);
  }
  render() {
    return (
      <ul>
        <SelectMenu onItemSelect={this.onItemSelect} selected={this.props.homeMap} items={this.props.maps} component={NavHomeItem} />
      </ul>
    )
  }
}

const mapStateToProps = ({ view: { homeMap } }) => ({ homeMap });

export default connect(mapStateToProps, { setHomeMap })(NavHomeMenu);