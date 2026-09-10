import React from 'react';

import { ReactComponent as ChevronRightIcon } from '../../../../common/images/icons/chevron-right.svg';

import Link from '../../../../Link';

import * as styles from './styles.module.scss';

const Breadcrumb = ({ 'aria-label': ariaLabel, className = '', crumbs, ...otherProps }) => <nav
    aria-label={ariaLabel}
    className={`${styles.breadcrumb} ${className}`}
    {...otherProps}
  >
  <ol>
    {crumbs.map(({ label, to }, index) => {
      const isCurrentCrumb = index === crumbs.length - 1;

      return <li key={to ?? label}>
        {isCurrentCrumb
          ? <span aria-current="page" className={styles.currentCrumb} title={label}>{label}</span>
          : <Link to={to}>{label}</Link>}

        {!isCurrentCrumb && <ChevronRightIcon aria-hidden="true" />}
      </li>;
    })}
  </ol>
</nav>;

export default Breadcrumb;
