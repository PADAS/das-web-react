import axios from 'axios'

import authConfig from '../utils/auth';

import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Route, Redirect } from 'react-router-dom';

authConfig();

class PrivateRoute extends Component {
  setToken({ access_token }) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
  }

  render() {
    const { component: Component, token, ...rest } = this.props;
    const hasToken = !!token;

    if (hasToken) {
      this.setToken(token);
    }

    return (
      <Route
        {...rest}
        render={props =>
          token.access_token ? (
            <Component {...this.props} />
          ) : (
              <Redirect
                to={{
                  pathname: '/login',
                  state: { from: this.props.location, },
                }}
              />
            )
        }
      />
    )
  }
}

const mapStateToProps = ({ data: { token } }) => ({ token });

export default connect(mapStateToProps)(PrivateRoute);