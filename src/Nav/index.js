import React, { Component } from 'react';
import { connect } from 'react-redux';

import NavHomeMenu from './NavHomeMenu';
import SystemStatusComponent from '../SystemStatus';

import './Nav.scss';

class Nav extends Component {
  render() {
    return (
      <nav>
        <SystemStatusComponent />
        {!!this.props.maps.length && <NavHomeMenu maps={this.props.maps} />}
        <div></div>
      </nav>
    )
  }
}

const mapStatetoProps = ({ data: { maps } }) => ({ maps });

export default connect(mapStatetoProps, null)(Nav);