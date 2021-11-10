import React, { useContext, useEffect, useCallback, useRef, memo } from 'react'; /* eslint-disable-line no-unused-vars */
import PropTypes from 'prop-types';
import noop from 'lodash/noop';

import { SocketContext } from '../withSocketConnection';

const StateManagedSocketConsumer = (props) => {
  const { type, callback = noop, onStateMismatch = noop } = props;

  const socket = useContext(SocketContext);

  const mid = useRef(0);

  useEffect(() => {
    if (socket) {

      const validateSocketIncrement = value => value === (mid.current+1);

      const unbindSocketHandler = () => {
        socket.off(type, socketHandler);
      };

      const socketHandler = (payload) => {
        const { mid: newMid } = payload;
        if (!validateSocketIncrement(newMid)) {
          onStateMismatch(payload);
        } else {
          callback(payload);
        }
        mid.current = newMid;
      };

      socket.on(type, socketHandler);

      return unbindSocketHandler;
    }
  }, [callback, onStateMismatch, socket, type]);


  return null;
};

export default memo(StateManagedSocketConsumer);

StateManagedSocketConsumer.propTypes = {
  type: PropTypes.string.isRequired,
  callback: PropTypes.func.isRequired,
  onStateMismatch: PropTypes.func,
};