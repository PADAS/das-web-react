import React, { Component, memo } from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Alert from 'react-bootstrap/Alert';

import { postAuth, clearAuth } from '../ducks/auth';
import { REACT_APP_ROUTE_PREFIX, FEATURE_FLAGS } from '../constants';

import { fetchSystemStatus } from '../ducks/system-status';
import { fetchEula } from '../ducks/eula';

import { ReactComponent as EarthRangerLogo } from '../common/images/earth-ranger-logo-vertical.svg';

import styles from './styles.module.scss';

const { Control, Label } = Form;

class LoginPage extends Component {
  constructor(props) {
    super(props);

    this.state = {
      username: '',
      password: '',
      hasError: false,
      error: {},
      errorMessage: '',
    };

    this.onFormSubmit = this.onFormSubmit.bind(this);
    this.onInputChange = this.onInputChange.bind(this);
  }

  componentDidMount() {
    this.props.clearAuth();
    this.props.fetchEula();
    this.props.fetchSystemStatus();
  }

  componentWillUnmount() {
    this.isCancelled = true;
  }
  onFormSubmit(e) {
    e.preventDefault();
    const data = this.state;

    this.props.postAuth(data)
      .then((success) => {
        this.props.history.push({
          pathname: REACT_APP_ROUTE_PREFIX,
          search: this.props.location.search,
        });
      })
      .catch((error) => {
        let errorObject = error.toJSON();
        this.props.clearAuth();

        const errorMessage = errorObject
          && errorObject.message
          && errorObject.message.includes('400') ? 'Invalid credentials given. Please try again.' 
          : 'An error has occured. Please try again.';

        !this.isCancelled && this.setState({
          ...this.state,
          hasError: true,
          error: errorObject,
          errorMessage,
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
    const {systemConfig, eula: { eula_url } } = this.props;

    const eulaEnabled = systemConfig?.[FEATURE_FLAGS.EULA];
     
    return <div className={styles.container}>
      <EarthRangerLogo className={styles.logo} />
      <Form name='login' className={styles.form} onSubmit={this.onFormSubmit}>
        <Label htmlFor='username'>Username</Label>
        <Control value={this.state.username} required={true} onChange={this.onInputChange} type='text' name='username' id='username' />
        <Label htmlFor='password'>Password</Label>
        <Control value={this.state.password} required={true} onChange={this.onInputChange} type='password' name='password' id='password' />
        <Button variant='primary' type='submit' name='submit'>Log in</Button>
        {this.state.hasError && <Alert className={styles.error} variant='danger'>
          {this.state.errorMessage}
        </Alert>}
      </Form>
      {eulaEnabled === true &&
        <p className={styles.eulalink}><a href={eula_url} target='_blank' rel='noopener noreferrer'>EarthRanger EULA</a>
        </p>}
    </div>;
  }
}

const mapStateToProps = ({ data: { eula, token }, view: { systemConfig } }) => ({ eula, token, systemConfig });

export default connect(mapStateToProps, { postAuth, clearAuth, fetchEula, fetchSystemStatus })(memo(withRouter(LoginPage)));
