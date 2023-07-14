import React, { memo } from 'react';
import PropTypes from 'prop-types';

import { ReactComponent as DocumentIcon } from '../../common/images/icons/document.svg';

import AddItemButton from '../../AddItemButton';

import styles from './styles.module.scss';

const AddReportButton = ({ className, ...rest }) => <AddItemButton
  className={`${className} ${styles.addReportButton}`}
  hideAddPatrolTab
  iconComponent={<DocumentIcon />}
  title="Report"
  {...rest}
/>;

AddReportButton.propTypes = { className: PropTypes.string };

export default memo(AddReportButton);
