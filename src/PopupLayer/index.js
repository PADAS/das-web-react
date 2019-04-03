import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';

import SubjectPopup from '../SubjectPopup';
import TimepointPopup from '../TimepointPopup';

export default class PopupLayer extends PureComponent {
  renderPopupContentByType(props) {
    const { popup, ...rest } = props;
    const { id, type, data } = popup;
    let Template;
    if (type === 'subject') Template = SubjectPopup;
    if (type === 'timepoint') Template = TimepointPopup;
    
    return Template ? <Template key={id} data={data} {...rest} /> : null;
  }
  render() {
    return this.renderPopupContentByType(this.props);
  }
}

PopupLayer.propTypes = {
  popup: PropTypes.object.isRequired,
  trackState: PropTypes.object.isRequired,
};