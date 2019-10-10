import React, { memo } from 'react';
import { connect } from 'react-redux';

import styles from './styles.module.scss';

const PrintTitle = (props) => {
  const { text } = props;
  return !!text && <h1 className={styles.title}>{text}</h1>;
};


const mapStateToProps = ({ view: { printTitle } }) => ({
  text: printTitle,
});

export default connect(mapStateToProps, null)(memo(PrintTitle));

