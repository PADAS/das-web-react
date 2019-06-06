import React, {Component} from 'react';
import styles from './styles.module.scss';
class MapLockControl extends Component {
  constructor(props) {
    super(props);

    this.state = {
      isLocked: false
    };

    this.handleClick = this.handleClick.bind(this);
  }

  render() {
    return <span className={this.props.className || ''}><button title="Lock Map" type="button" className={styles.maplock} onClick={this.handleClick}>Lock Map</button></span>;
  }

  handleClick(e) {
    e.preventDefault();
    console.log('The map lock was clicked.');
  }
};

export default MapLockControl;