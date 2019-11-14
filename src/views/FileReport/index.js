import React, { useState, useEffect, useRef, memo } from 'react';
import { connect } from 'react-redux';

import AddReport from '../../AddReport';
// import ErrorBoundary from '../../ErrorBoundary';


const FileReportView = (props) => {
  const containerRef = useRef(null);
  
  return <div ref={containerRef}>
    <AddReport container={containerRef} />
  </div>
};

const mapStateToProps = () => ({});
export default connect(mapStateToProps, {})(memo(FileReportView));