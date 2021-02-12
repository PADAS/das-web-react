import React, { useCallback, useEffect, useState, memo } from 'react';
import AddReport1 from '../AddReport';
import AddReport2 from '../AddReport2';
import AddReport3 from '../AddReport3';

const components = [AddReport1, AddReport2, AddReport3];

const MetaAddReport = (props) => {
  const [index, setIndex] = useState(0);

  useEffect(() => {

    const bindKeys = (event) => {
      const { shiftKey, keyCode } = event;

      console.log({ event });

      if (!shiftKey || keyCode !== 79) return;

      const newIndex = index+1;

      if (newIndex >= components.length) {
        setIndex(0);
      } else {
        setIndex(newIndex);
      }
    };

    window.addEventListener('keydown', bindKeys);
    
    return () => {
      window.removeEventListener('keydown', bindKeys);
    };
    
  }, [index]);

  const Component = components[index];
  
  console.log({ Component });

  return <Component {...props} />;

};

export default memo(MetaAddReport);