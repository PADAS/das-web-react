import React, { forwardRef, memo } from 'react';
import PropTypes from 'prop-types';

import { ReactComponent as DocumentIcon } from '../../common/images/icons/document.svg';

import AddReport from '../../AddReport';

import styles from './styles.module.scss';

const AddReportButton = ({ className, ...rest }, ref) => <AddReport
  className={`${className} ${styles.addReportButton}`}
  iconComponent={<DocumentIcon />}
  popoverPlacement="top"
  ref={ref}
  title="Report"
  {...rest}
/>;

AddReportButton.propTypes = { className: PropTypes.string };

export default memo(forwardRef(AddReportButton));
