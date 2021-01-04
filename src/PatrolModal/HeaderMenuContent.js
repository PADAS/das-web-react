
import React, { memo, forwardRef } from 'react';
import PropTypes from 'prop-types';
import Popover from 'react-bootstrap/Popover';
// import Button from 'react-bootstrap/Button';

import PriorityPicker from '../PriorityPicker';
import { withFormDataContext } from '../EditableItem/context';

import styles from './styles.module.scss';

const PatrolHeaderMenuContent = (props, ref) => {
  const { data, onPrioritySelect, ...rest } = props;

  return <Popover {...rest} ref={ref} className={styles.headerPopover}>
    <Popover.Title>Patrol {data.serial_number}</Popover.Title>
    <Popover.Content>
      <h6>Priority:</h6>
      <PriorityPicker selected={data.priority} onSelect={onPrioritySelect} />
      <hr />
      {/* <Button type='button' variant='primary'>Export Patrol</Button> */}
    </Popover.Content>
  </Popover>;
};

export default memo(withFormDataContext(forwardRef(PatrolHeaderMenuContent)));

PatrolHeaderMenuContent.propTypes = {
  data: PropTypes.object.isRequired,
  onPrioritySelect: PropTypes.func.isRequired,
};