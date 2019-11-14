import axios from 'axios';

import authConfig from '../utils/auth';

import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Route, Redirect } from 'react-router-dom';

import { REACT_APP_ROUTE_PREFIX } from '../constants';
import { resetMasterCancelToken } from '../ducks/auth';

authConfig();

class PrivateRoute extends Component {
  loginPath = `${REACT_APP_ROUTE_PREFIX}${REACT_APP_ROUTE_PREFIX === '/' ? 'login' : '/login'}`;
  
  setToken({ access_token }) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
  }

  componentDidMount() {
    const { token } = this.props;
    
    const hasToken = !!token;
  
    if (hasToken) {
      this.setToken(token);
    }
    
  }

  render() {
    const { component: Component, resetMasterCancelToken, dispatch: _dispatch, token, ...rest } = this.props;

    return (
      <Route
        {...rest}
        render={_props =>
          token.access_token ? (
            <Component {...this.props} />
          ) : (
            <Redirect
              to={{
                pathname: this.loginPath,
                state: { from: this.props.location, },
              }}
            />
          )
        }
      />
    );
  }
}

const mapStateToProps = ({ data: { token } }) => ({ token });

export default connect(mapStateToProps, { resetMasterCancelToken })(PrivateRoute);