import React, { memo } from 'react';
import HamburgerMenuIcon from '../HamburgerMenuIcon';

import styles from './styles.module.scss';

const KebabMenuIcon = ({ className = '', ...rest }) => <HamburgerMenuIcon className={`${styles.kebab} ${className}`} {...rest} />;

export default memo(KebabMenuIcon);