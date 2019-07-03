import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Redirect } from 'react-router-dom';

import { postAuth, clearAuth } from '../../ducks/auth';
import { REACT_APP_ROUTE_PREFIX } from '../../constants';

class LoginPage extends Component {
  constructor(props) {
    super(props);

    this.state = {
      username: '',
      password: '',
      hasError: false,
      error: {},
    };

    this.onFormSubmit = this.onFormSubmit.bind(this);
    this.onInputChange = this.onInputChange.bind(this);
  }
  componentWillUnmount() {
    this.isCancelled = true;
  }
  onFormSubmit(e) {
    e.preventDefault();
    const data = this.state;

    this.props.postAuth(data)
      .then((success) => {
        this.props.history.push(REACT_APP_ROUTE_PREFIX);
      })
      .catch((error) => {
        this.props.clearAuth();

        !this.isCancelled && this.setState({
          hasError: true,
          error,
        });
      })
      .finally(() => {
        !this.isCancelled && this.setState({
          username: '',
          password: '',
        });
      });
  }
  onInputChange(event) {
    event.preventDefault();

    if (this.state.hasError) this.setState({ error: {}, hasError: false });

    const { value, id } = event.target;
    this.setState({
      [id]: value,
    });
  }
  render() {
    const { access_token } = this.props.token;
    return access_token ? (<Redirect
      to={{
        pathname: REACT_APP_ROUTE_PREFIX,
        state: { from: this.props.location, },
      }}
    />) : (
        <form onSubmit={this.onFormSubmit}>
          <label htmlFor="username">Username</label>
          <input value={this.state.username} required={true} onChange={this.onInputChange} type="text" name="username" id="username" />
          <label htmlFor="password">Password</label>
          <input value={this.state.password} required={true} onChange={this.onInputChange} type="password" name="password" id="password" />
          <button type="submit">Submit</button>
          {this.state.hasError && (
            <p>An error has occured. Please try again.</p>
          )}
        </form>
      );
  }
}

const mapStateToProps = ({ data: { token } }) => ({ token });

export default connect(mapStateToProps, { postAuth, clearAuth })(LoginPage);