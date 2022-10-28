
import React, { memo, forwardRef } from 'react';
import Popover from 'react-bootstrap/Popover';
import PropTypes from 'prop-types';

import { withFormDataContext } from '../EditableItem/context';

import PriorityPicker from '../PriorityPicker';

import styles from './styles.module.scss';

const PatrolHeaderMenuContent = ({ data, onPrioritySelect, ...rest }, ref) => {
  return <Popover {...rest} ref={ref} className={styles.headerPopover}>
    <Popover.Header>Patrol {data.serial_number}</Popover.Header>

    <Popover.Body>
      <h6>Priority:</h6>
      <PriorityPicker selected={data.priority} onSelect={onPrioritySelect} />
      <hr />
    </Popover.Body>
  </Popover>;
};

PatrolHeaderMenuContent.propTypes = {
  data: PropTypes.object.isRequired,
  onPrioritySelect: PropTypes.func.isRequired,
};

export default memo(withFormDataContext(forwardRef(PatrolHeaderMenuContent)));
