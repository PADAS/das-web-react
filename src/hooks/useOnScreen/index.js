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
    if (!!element) {
      intersectionObserverRef.current.observe(element);
    } else {
      setIsElementOnScreen(false);
    }
  }, [element]);

  return isElementOnScreen;
};

export default useOnScreen;
