import { useEffect, useRef, useState } from 'react';

const useOnScreen = (element) => {
  const intersectionObserverRef = useRef(null);

  const [isElementOnScreen, setIsElementOnScreen] = useState(false);

  useEffect(() => {
    intersectionObserverRef.current = new IntersectionObserver(
      ([entry]) => setIsElementOnScreen(entry.isIntersecting)
    );

    return () => intersectionObserverRef.current.disconnect();
  }, []);

  useEffect(() => {
    if (element) {
      intersectionObserverRef.current.observe(element);
    } else {
      // Updating state from this effect is intended.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsElementOnScreen(false);
    }
  }, [element]);

  return isElementOnScreen;
};

export default useOnScreen;
