import { ReactComponent as MarkerFeedIcon } from '../common/images/icons/marker-feed.svg';
import { ReactComponent as PolygonIcon } from '../common/images/icons/polygon.svg';
import { ReactComponent as PolylineIcon } from '../common/images/icons/polyline.svg';

import * as styles from './styles.module.scss';

const ICONS_BY_SHAPE = {
  line: PolylineIcon,
  point: MarkerFeedIcon,
  polygon: PolygonIcon,
};

const SHAPES_BY_GEOMETRY_TYPE = {
  LineString: 'line',
  MultiLineString: 'line',
  MultiPoint: 'point',
  MultiPolygon: 'polygon',
  Point: 'point',
  Polygon: 'polygon',
};

const FeatureGeometryIcon = ({ className = '', geometryType, ...otherProps }) => {
  const shape = SHAPES_BY_GEOMETRY_TYPE[geometryType];

  if (!shape) return null;

  const Icon = ICONS_BY_SHAPE[shape];

  return <Icon
    aria-hidden="true"
    className={`${styles.featureGeometryIcon} ${className}`}
    data-testid={`featureGeometryIcon-${shape}Icon`}
    {...otherProps}
  />;
};

export default FeatureGeometryIcon;
