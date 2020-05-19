import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Route, Redirect } from 'react-router-dom';

import { getTemporaryAccessTokenFromCookies } from '../utils/auth';

import { REACT_APP_ROUTE_PREFIX } from '../constants';

class PrivateRoute extends Component {
  loginPath = `${REACT_APP_ROUTE_PREFIX}login`;
  eulaPath = `${REACT_APP_ROUTE_PREFIX}eula`;


  render() {
    const { component: Component, dispatch: _dispatch, token, ...rest } = this.props;
    const temporaryAccessToken = getTemporaryAccessTokenFromCookies();

    const optionalProps = temporaryAccessToken ? { temporaryAccessToken } : {};

    return (
      <Route
        {...rest}
        render={_props =>
          (temporaryAccessToken || token.access_token) ? (
            <Component {...optionalProps} {...this.props} />
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

export default connect(mapStateToProps, null)(PrivateRoute);