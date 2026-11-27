import { render, screen } from '../test-utils';

import FeatureGeometryIcon from './';

describe('FeatureGeometryIcon', () => {
  test.each([
    ['Point', 'point'],
    ['MultiPoint', 'point'],
    ['LineString', 'line'],
    ['MultiLineString', 'line'],
    ['Polygon', 'polygon'],
    ['MultiPolygon', 'polygon'],
  ])('shows the %s geometry as the %s icon', (geometryType, shape) => {
    render(<FeatureGeometryIcon geometryType={geometryType} />);

    expect(screen.getByTestId(`featureGeometryIcon-${shape}Icon`)).toBeInTheDocument();
  });

  test('hides the icon from assistive technologies', () => {
    render(<FeatureGeometryIcon geometryType="Point" />);

    expect(screen.getByTestId('featureGeometryIcon-pointIcon')).toHaveAttribute('aria-hidden', 'true');
  });

  test.each([undefined, 'GeometryCollection'])('does not show an icon for the %s geometry', (geometryType) => {
    const { container } = render(<FeatureGeometryIcon geometryType={geometryType} />);

    expect(container).toBeEmptyDOMElement();
  });
});
