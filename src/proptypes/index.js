import PropTypes from 'prop-types';

export const analyticsMetadataProps = PropTypes.shape({
  category: PropTypes.string.isRequired,
  location: PropTypes.string,
});

export const mapDrawToolsDisplayConfigPropType = PropTypes.shape({
  linePaint: PropTypes.object,
  lineLayout: PropTypes.object,
  circlePaint: PropTypes.object,
  fillLayout: PropTypes.object,
  fillPaint: PropTypes.object,
  symbolPaint: PropTypes.object,
  lineSymbolLayout: PropTypes.object,
  polygonSymbolLayout: PropTypes.object
});

export const childrenPropType = PropTypes.oneOfType([
  PropTypes.arrayOf(PropTypes.node),
  PropTypes.node
]);


export const addReportFormProps = PropTypes.shape({
  hidePatrols: PropTypes.bool,
  isPatrolReport: PropTypes.bool,
  onSaveError: PropTypes.func,
  onSaveSuccess: PropTypes.func,
  relationshipButtonDisabled: PropTypes.bool,
});