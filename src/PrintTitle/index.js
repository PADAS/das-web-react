import React from 'react';
import { useSelector } from 'react-redux';

import styles from './styles.module.scss';

const PrintTitle = () => {
  const printTitle = useSelector((state) => state.view.printTitle);
  const iconSrc = useSelector(state => state.view.homeMap?.icon?.src);

  if (!printTitle) return null;

  return <h1 className={styles.title}>
    <>{iconSrc ? <img src={iconSrc} alt={printTitle} /> : null}</>
    {printTitle}
  </h1>;
};

export default PrintTitle;
