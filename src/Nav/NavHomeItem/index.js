import React, { Component } from 'react';
import { calcUrlForImage } from '../../utils/img';

export default class extends Component {
  render() {
    const { id, icon, title, name, menu, ...rest } = this.props;
    const iconImg = icon ? <img alt={title} src={calcUrlForImage(icon.src)} /> : null;
    const titleEl = title ? <h6 className="title">{title}</h6> : null;
    const nameEl = name ? <h6 className="name">{name}</h6> : null;
    return (
      <li {...rest}>
        {iconImg}
        {titleEl}
        {nameEl}
      </li>
    )
  }
}