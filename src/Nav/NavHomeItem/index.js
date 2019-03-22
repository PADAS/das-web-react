import React, { Component, Fragment } from 'react';
import { calcUrlForImage } from '../../utils/img';

export default class extends Component {
  render() {
    const { id, icon, title, name, menu, ...rest } = this.props;
    const displayTitle = title || name || null;

    return (
      <Fragment>
        {!!icon &&
          <img alt={title} src={calcUrlForImage(icon.src)} />
        }
        {!!displayTitle &&
          <h6>{displayTitle}</h6>
        }
      </Fragment>
    );
  }
}