import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { Popup } from 'react-mapbox-gl';

import SubjectPopup from '../SubjectPopup';
import TimepointPopup from '../TimepointPopup';

export default class PopupLayer extends PureComponent {
  renderPopupContentByType(popup) {
    const { id, type, ...rest } = popup;
    let Template;
    if (type === 'subject') Template = SubjectPopup;
    if (type === 'timepoint') Template = TimepointPopup;
    
    return Template && <Template key={id} {...rest} />
  }
  render() {
    const { popups, ...rest } = this.props;
    return popups.map(popup => this.renderPopupContentByType(popup));
  }
}

PopupLayer.propTypes = {
  popups: PropTypes.array.isRequired,
};