import { memo, useRef, useState, useEffect } from 'react';
import PropTypes from 'prop-types';

const DelayedUnmount = (props) => {
  const { children, isMounted, delay = 400 } = props;
  const [mounted, setMountState] = useState(false);

  const timeoutRef = useRef(null);

  useEffect(() => {
    if (isMounted !== mounted) {
      if (!isMounted) {
        timeoutRef.current = setTimeout(() => {
          setMountState(isMounted);
        }, delay);
      } else {
        setMountState(isMounted);
      }
    }
    return () => {
      clearTimeout(timeoutRef.current);
    };
  }, [isMounted, mounted]); // eslint-disable-line react-hooks/exhaustive-deps

  return mounted && children;

};

DelayedUnmount.propTypes = {
  isMounted: PropTypes.bool,
  delay: PropTypes.number,
};

export default memo(DelayedUnmount);