import React, { Component } from 'react';
import { REACT_APP_DAS_HOST } from '../../constants';

const urlContainsOwnHost = url => url.includes('http');

const calcUrlForImage = (imagePath) => {
  if (urlContainsOwnHost(imagePath)) return imagePath;
  return `${REACT_APP_DAS_HOST}/${imagePath}`;
};

export default class extends Component {
  render() {
    const { id, icon, title, name, ...rest } = this.props;
    return (
      <li {...rest} key={id}>
        {icon ?
          (<img alt={title} src={calcUrlForImage(icon.src)} />)
          : (<h6>{title || name}</h6>)}
      </li>
    )
  }
}