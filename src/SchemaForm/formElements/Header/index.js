import React, { memo } from 'react';

import { HEADER_ELEMENT_SIZES } from '../../../utils/form-schemas/constants';

import * as styles from './styles.module.scss';

const HEADER_THEMES = {
  [HEADER_ELEMENT_SIZES.LARGE]: styles.large,
  [HEADER_ELEMENT_SIZES.MEDIUM]: styles.medium,
  [HEADER_ELEMENT_SIZES.SMALL]: styles.small
};

const Header = ({ details, id }) => <p
  className={`${styles.header} ${HEADER_THEMES[details.size]}`}
  data-testid={`schema-form-header-${id}`}
  >
  {details.label}
</p>;

export default memo(Header);
