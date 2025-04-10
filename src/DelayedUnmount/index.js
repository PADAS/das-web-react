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
