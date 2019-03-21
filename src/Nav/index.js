import './Nav.css';
import React, { Component } from 'react';
import NavHomeMenu from './NavHomeMenu';
import SystemStatusComponent from '../SystemStatus';

import { connect } from 'react-redux';



class Nav extends Component {
  render() {
    return (
      <nav>
        <SystemStatusComponent />
        {!!this.props.maps.length && <NavHomeMenu maps={this.props.maps} />}
      </nav>
    )
  }
}

const mapStatetoProps = ({ data: { maps } }) => ({ maps });

export default connect(mapStatetoProps, null)(Nav);