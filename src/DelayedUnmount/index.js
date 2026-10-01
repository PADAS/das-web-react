import { memo, useRef, useState, useEffect } from 'react';

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
        // Updating state from this effect is intended.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMountState(isMounted);
      }
    }
    return () => {
      clearTimeout(timeoutRef.current);
    };
  }, [delay, isMounted, mounted]);

  return mounted && children;

};

export default memo(DelayedUnmount);
